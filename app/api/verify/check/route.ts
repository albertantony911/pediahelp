export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { sha256, nowSec } from '@/lib/crypto';

export async function POST(req: Request) {
  const { sessionId, otp } = await req.json();
  if (!sessionId || !/^\d{6}$/.test(otp)) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const ref = db.collection('otpSessions').doc(sessionId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: 'invalid_session' }, { status: 400 });
  const s = snap.data()!;

  if (s.expiresAt < nowSec()) return NextResponse.json({ error: 'expired' }, { status: 400 });
  if (s.tries >= 5) return NextResponse.json({ error: 'too_many_attempts' }, { status: 429 });

  const ok = s.otpHash === sha256(otp);
  await ref.update({ tries: s.tries + 1, verified: ok });

  if (!ok) return NextResponse.json({ error: 'invalid_otp' }, { status: 400 });
  return NextResponse.json({ ok: true, scope: s.scope });
}