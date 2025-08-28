// app/api/heimdall/book/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { getSession, markUsed } from '@/lib/otp-store-redis';
import { nowSec } from '@/lib/crypto';

const MIN_DELAY_MS = 48 * 60 * 60 * 1000; // 48h

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, doctorId, slot, patient } = body || {};

    if (!sessionId || !doctorId || !slot || !patient?.parentName || !patient?.childName || !patient?.phone || !patient?.email) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    // Enforce 48h buffer at booking time as well (server truth)
    if (new Date(slot).getTime() < Date.now() + MIN_DELAY_MS) {
      return NextResponse.json({ error: 'too_soon' }, { status: 400 });
    }

    // Validate OTP session (same pattern as reviews submit)
    const s = await getSession(sessionId);
    if (!s)                     return NextResponse.json({ error: 'invalid_session' }, { status: 400 });
    if (s.expiresAt < nowSec()) return NextResponse.json({ error: 'expired' }, { status: 400 });
    if (!s.verified)            return NextResponse.json({ error: 'not_verified' }, { status: 400 });
    if (s.used)                 return NextResponse.json({ error: 'already_used' }, { status: 400 });
    if (s.scope !== 'booking')  return NextResponse.json({ error: 'wrong_scope' }, { status: 403 });

    // Prevent double-booking the same doctor+slot
    const alreadyBooked = await client.fetch(
      `*[_type == "booking" && doctor._ref == $doctorId AND slot == $slot][0]{ _id }`,
      { doctorId, slot }
    );
    if (alreadyBooked) {
      return NextResponse.json({ error: 'slot_taken' }, { status: 409 });
    }

    // Create booking in Sanity (status: 'verified' so payment can proceed)
    const booking = await client.create({
      _type: 'booking',
      doctor: { _type: 'reference', _ref: doctorId },
      slot,
      patientName: patient.parentName,
      childName: patient.childName,
      phone: patient.phone, // expects +91##########
      email: patient.email,
      status: 'verified',
      confirmedAt: new Date().toISOString(),
    });

    // Mark the OTP session used
    await markUsed(sessionId);

    return NextResponse.json({ ok: true, bookingId: booking._id });
  } catch (e: any) {
    console.error('[heimdall/book] error:', e?.message || e);
    return NextResponse.json({ error: 'book_failed' }, { status: 500 });
  }
}