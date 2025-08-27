// app/api/reviews/submit/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { nowSec } from '@/lib/crypto';
import { getSession, markUsed } from '@/lib/otp-store-redis';
import { sendDoctorReviewNotification } from '@/lib/mailer';
import { client } from '@/sanity/lib/client';
import { groq } from 'next-sanity';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Coerce + trim basic fields
    const sessionId: string | undefined = body?.sessionId?.toString().trim();
    const doctorId: string | undefined = body?.doctorId?.toString().trim();
    const name: string | undefined = body?.name?.toString().trim();
    const email: string | undefined = body?.email?.toString().trim();
    const phone: string | undefined = body?.phone?.toString().replace(/\D/g, '');
    const comment: string | undefined = body?.comment?.toString();
    const ratingNum = Number(body?.rating);

    // Basic guards (required + simple shape)
    if (!sessionId || !doctorId || !name || !email || !phone || !comment || !Number.isFinite(ratingNum)) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }
    if (ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: 'invalid_rating' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
    }
    if (!/^\d{10}$/.test(phone)) {
      return NextResponse.json({ error: 'invalid_phone' }, { status: 400 });
    }

    // Validate OTP session
    const s = await getSession(sessionId);
    if (!s)                     return NextResponse.json({ error: 'invalid_session' }, { status: 400 });
    if (s.expiresAt < nowSec()) return NextResponse.json({ error: 'expired' }, { status: 400 });
    if (!s.verified)            return NextResponse.json({ error: 'not_verified' }, { status: 400 });
    if (s.used)                 return NextResponse.json({ error: 'already_used' }, { status: 400 });
    if (s.scope !== 'review')   return NextResponse.json({ error: 'wrong_scope' }, { status: 403 });

    await markUsed(sessionId);

    // Fetch doctor name for nicer emails/UX
    let doctorName: string | undefined;
    try {
      doctorName = await client.fetch(
        groq`*[_type == "doctor" && _id == $id][0].name`,
        { id: doctorId.replace(/^drafts\./, '') }
      );
    } catch (e: any) {
      console.warn('[reviews/submit] doctor_lookup_failed:', e?.message || e);
    }

    // Create review in Sanity
    let createdId: string | null = null;
    try {
      const res = await client.create({
        _type: 'review',
        doctor: { _type: 'reference', _ref: doctorId },
        name,
        email,
        phone,
        rating: ratingNum,
        comment,
        approved: false, // keep moderation in place
        submittedAt: new Date().toISOString(),
      });
      createdId = res._id;
    } catch (e: any) {
      console.error('[reviews/submit] sanity_create_failed:', e?.message || e);
    }

    // Optional: archive to Firestore (best-effort)
    try {
      await db.collection('doctorReviews').add({
        sessionId,
        doctorId,
        doctorName: doctorName || null,
        name,
        email,
        phone,
        rating: ratingNum,
        comment,
        createdAt: nowSec(),
        sanityId: createdId || null,
      });
    } catch (e: any) {
      console.error('[reviews/submit] archive_failed:', e?.message || e);
    }

    // Notify via email — use doctorName (fallback to "Doctor" if not found)
    const to =
      process.env.REVIEWS_RECEIVER ||
      process.env.MAIL_RECEIVER ||
      process.env.MAIL_USER ||
      email;

    try {
      await sendDoctorReviewNotification(to, {
        doctorName: doctorName || 'Doctor',
        // doctorId stays optional/fallback inside mailer; not shown in templates
        name,
        email,
        phone,
        rating: ratingNum,
        comment,
        // no reviewId passed to keep emails clean
      });
    } catch (e: any) {
      console.error('[reviews/submit] mailer_error:', e?.message || e);
      return NextResponse.json({ ok: true, mail: 'failed' });
    }

    return NextResponse.json({ ok: true, mail: 'sent' });
  } catch (e: any) {
    console.error('[reviews/submit] error:', e?.message || e);
    return NextResponse.json({ error: 'submit_failed' }, { status: 500 });
  }
}