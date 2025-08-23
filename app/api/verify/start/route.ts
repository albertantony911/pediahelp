export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { bumpRateOrThrow } from '@/lib/ratelimit';
import { randomOtp, sha256, randomId, nowSec } from '@/lib/crypto';
import { sendWithPolicy, Channel } from '@/lib/otp-channels';

export async function POST(req: Request) {
  try {
    const { identifier, channel='auto', scope='contact', recaptchaToken, honeypot, startedAt } = await req.json();

    if (!identifier || typeof identifier !== 'string') return NextResponse.json({ error: 'bad_identifier' }, { status: 400 });
    if (!recaptchaToken) return NextResponse.json({ error: 'no_recaptcha' }, { status: 400 });
    if (honeypot) return NextResponse.json({ error: 'bot_detected' }, { status: 400 });
    if (startedAt && Date.now() - Number(startedAt) < 1500) return NextResponse.json({ error: 'too_fast' }, { status: 400 });

    const ok = await verifyRecaptcha(recaptchaToken);
    if (!ok) return NextResponse.json({ error: 'recaptcha_failed' }, { status: 400 });

    const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'ip') as string;

    await bumpRateOrThrow(`otp:ip:${ip}`, 3600, 5);
    await bumpRateOrThrow(`otp:id:${identifier}`, 3600, 3);

    const sessionId = randomId(12);
    const code = randomOtp();

    const channelUsed = await sendWithPolicy(identifier, code, channel as Channel);

    await db.collection('otpSessions').doc(sessionId).set({
      identifier,
      channelUsed,
      scope,
      otpHash: sha256(code),
      expiresAt: nowSec() + 600, // 10 min
      tries: 0,
      verified: false,
      used: false,
      createdAt: nowSec(),
      ip
    });

    return NextResponse.json({ sessionId, channelUsed });
  } catch (e:any) {
    const status = e.message === 'RATE_LIMITED' ? 429 : 400;
    return NextResponse.json({ error: e.message || 'start_failed' }, { status });
  }
}