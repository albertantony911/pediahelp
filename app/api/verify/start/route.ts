export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { bumpRateOrThrow } from '@/lib/ratelimit';
import { randomOtp, sha256, randomId, nowSec } from '@/lib/crypto';
import { sendWithPolicy, Channel } from '@/lib/otp-channels';

export async function POST(req: Request) {
  const t0 = Date.now();
  const tick = (label: string) => console.log(`[verify/start] ${label} +${Date.now() - t0}ms`);

  try {
    tick('begin');
    const {
      identifier,
      channel = 'auto',
      scope = 'contact',
      recaptchaToken,
      honeypot,
      startedAt,
    } = await req.json();

    // Basic validations
    if (!identifier || typeof identifier !== 'string') {
      tick('bad_identifier');
      return NextResponse.json({ error: 'bad_identifier' }, { status: 400 });
    }
    if (!recaptchaToken) {
      tick('no_recaptcha');
      return NextResponse.json({ error: 'no_recaptcha' }, { status: 400 });
    }
    if (honeypot) {
      tick('bot_detected');
      return NextResponse.json({ error: 'bot_detected' }, { status: 400 });
    }
    if (startedAt && Date.now() - Number(startedAt) < 1500) {
      tick('too_fast');
      return NextResponse.json({ error: 'too_fast' }, { status: 400 });
    }

    // reCAPTCHA verify (add a 4s cap)
    tick('recaptcha_verify_start');
    const recaptchaOk = await Promise.race([
      verifyRecaptcha(recaptchaToken),
      new Promise<boolean>((_res, rej) => setTimeout(() => rej(new Error('RECAPTCHA_TIMEOUT')), 4000)),
    ]).catch((e) => {
      if (e?.message === 'RECAPTCHA_TIMEOUT') return false;
      throw e;
    });
    tick('recaptcha_verify_end');

    if (!recaptchaOk) {
      tick('recaptcha_failed');
      return NextResponse.json({ error: 'recaptcha_failed' }, { status: 400 });
    }

    // Rate limits
    const ip = (req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for') ||
      'ip') as string;

    tick('ratelimit_start');
    await bumpRateOrThrow(`otp:ip:${ip}`, 3600, 5);
    await bumpRateOrThrow(`otp:id:${identifier}`, 3600, 3);
    tick('ratelimit_ok');

    // Create session + send OTP (cap at 8s overall)
    const sessionId = randomId(12);
    const code = randomOtp();
    tick('code_ready');

    // TEMP: if you want email-only during testing, set EMAIL_ONLY=true in env
    const effectiveChannel: Channel = process.env.EMAIL_ONLY === 'true' ? 'email' : (channel as Channel);

    tick('otp_send_start');
    const otpSend = sendWithPolicy(identifier, code, effectiveChannel);
    const channelUsed = await Promise.race([
      otpSend,
      new Promise<never>((_res, rej) => setTimeout(() => rej(new Error('OTP_SEND_TIMEOUT')), 8000)),
    ]);
    tick('otp_sent');

    // Save session
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
      ip,
    });
    tick('session_saved');

    return NextResponse.json({ sessionId, channelUsed });
  } catch (e: any) {
    const msg = e?.message || 'start_failed';
    console.error('[verify/start] error:', msg);

    // Map common errors to clearer statuses
    if (msg === 'RATE_LIMITED') return NextResponse.json({ error: msg }, { status: 429 });
    if (msg === 'OTP_SEND_TIMEOUT') return NextResponse.json({ error: 'otp_delivery_timeout' }, { status: 504 });

    return NextResponse.json({ error: msg }, { status: 400 });
  } finally {
    console.log(`[verify/start] end total=${Date.now() - t0}ms`);
  }
}