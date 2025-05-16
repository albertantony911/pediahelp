import type { Slug } from "@/sanity.types";
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { bookingId, otp } = await req.json();

  if (!bookingId || !otp) {
    return NextResponse.json({ error: 'Missing bookingId or otp' }, { status: 400 });
  }

  const stored = globalThis.tempOtps?.[bookingId];

  if (!stored) {
    return NextResponse.json({ error: 'OTP expired or not found' }, { status: 404 });
  }

  if (stored !== otp) {
    return NextResponse.json({ error: 'Invalid OTP' }, { status: 401 });
  }

  // OTP is correct → remove from memory
  if (globalThis.tempOtps) {
    delete globalThis.tempOtps[bookingId];
  }

  return NextResponse.json({ success: true });
}