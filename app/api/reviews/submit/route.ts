// app/api/reviews/submit/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin'; // if you’re archiving to Firestore
import { nowSec } from '@/lib/crypto';
import { getSession, markUsed } from '@/lib/otp-store-redis';
import { sendDoctorReviewNotification } from '@/lib/mailer';
import { client } from '@/sanity/lib/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, doctorId, name, email, phone, rating, comment } = body || {};

    if (!sessionId || !doctorId || !name || !email || !phone || !rating || !comment) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    // Validate OTP session
    const s = await getSession(sessionId);
    if (!s)                     return NextResponse.json({ error: 'invalid_session' }, { status: 400 });
    if (s.expiresAt < nowSec()) return NextResponse.json({ error: 'expired' }, { status: 400 });
    if (!s.verified)            return NextResponse.json({ error: 'not_verified' }, { status: 400 });
    if (s.used)                 return NextResponse.json({ error: 'already_used' }, { status: 400 });
    if (s.scope !== 'review')   return NextResponse.json({ error: 'wrong_scope' }, { status: 403 });

    await markUsed(sessionId);

    // Add review to Sanity
    let createdId: string | null = null;
    try {
      const res = await client.create({
        _type: 'review',
        doctor: { _type: 'reference', _ref: doctorId },
        name,
        email,
        phone,
        rating,
        comment,
        approved: false, // you can moderate
        submittedAt: new Date().toISOString(),
      });
      createdId = res._id;
    } catch (e: any) {
      console.error('[reviews/submit] sanity_create_failed:', e?.message || e);
    }

    // Optionally archive to Firestore (if you want redundancy)
    try {
      await db.collection('doctorReviews').add({
        sessionId,
        doctorId,
        name,
        email,
        phone,
        rating,
        comment,
        createdAt: nowSec(),
      });
    } catch (e: any) {
      console.error('[reviews/submit] archive_failed:', e?.message || e);
    }

    // Notify via email
    const to =
      process.env.REVIEWS_RECEIVER ||
      process.env.MAIL_RECEIVER ||
      process.env.MAIL_USER ||
      email;

    try {
      await sendDoctorReviewNotification(to, {
        doctorId,
        name,
        email,
        phone,
        rating,
        comment,
        reviewId: createdId || undefined,
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