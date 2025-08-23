export const runtime = 'nodejs';
export const preferredRegion = ['bom1'];

import { NextResponse } from 'next/server';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { bumpRateOrThrow } from '@/lib/ratelimit';
import { randomOtp, sha256, randomId, nowSec } from '@/lib/crypto';
import { createSession, setPlainCode } from '@/lib/otp-store';

export async function POST(req: Request) {
  const t0 = Date.now();
  const tick = (l: string) => console.log(`[verify/start] ${l} +${Date.now() - t0}ms`);

  try {
    const {
      identifier,
      channel = 'auto',
      scope = 'contact',
      recaptchaToken,
      honeypot,
      startedAt,
    } = await req.json();

    tick('begin');

    // Basic guards
    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json({ error: 'bad_identifier' }, { status: 400 });
    }
    if (!recaptchaToken) {
      return NextResponse.json({ error: 'no_recaptcha' }, { status: 400 });
    }
    if (honeypot) {
      return NextResponse.json({ error: 'bot_detected' }, { status: 400 });
    }

    const minDelay = Number(process.env.START_MIN_DELAY_MS || 1200);
    if (startedAt && Date.now() - Number(startedAt) < minDelay) {
      return NextResponse.json({ error: 'too_fast' }, { status: 400 });
    }

    const ip =
      (req.headers.get('cf-connecting-ip') ||
        req.headers.get('x-forwarded-for') ||
        'ip') as string;

    // Run reCAPTCHA + rate limits in parallel
    tick('guards_start');
    await Promise.all([
      (async () => {
        const ok = await verifyRecaptcha(recaptchaToken);
        if (!ok) throw new Error('recaptcha_failed');
      })(),
      (async () => {
        const ipMax = Number(process.env.RL_IP_MAX || 50); // dev-friendly default
        const idMax = Number(process.env.RL_ID_MAX || 50);
        await bumpRateOrThrow(`ip:${ip}`, 3600, ipMax);
        await bumpRateOrThrow(`id:${identifier}`, 3600, idMax);
      })(),
    ]);
    tick('guards_ok');

    // Create OTP session
    const sessionId = randomId(12);
    const code = randomOtp();
    const expiresAt = nowSec() + 600;

    await createSession(sessionId, {
      identifier,
      scope,
      otpHash: sha256(code),
      expiresAt,
      ip,
    });
    await setPlainCode(sessionId, code, 120); // short-lived for internal sender
    tick('session_created');

    // Queue async send on the same origin (preview/prod safe). Don't await.
    try {
      const host = req.headers.get('host') || '';
      const proto = host.startsWith('localhost') ? 'http' : 'https';
      const base = host
        ? `${proto}://${host}`
        : (process.env.SITE_URL || '').replace(/\/$/, '');
      const url = `${base}/api/internal/send-otp`;

      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SEND_TOKEN || ''}`,
        },
        body: JSON.stringify({ sessionId, identifier, channel }),
        keepalive: true,
      })
        .then((r) => {
          console.log('[verify/start] queued send-otp to', url, 'status', r.status);
        })
        .catch((e) => {
          console.error('[verify/start] queue error:', e?.message || e);
        });
    } catch (e: any) {
      console.error('[verify/start] queue failed:', e?.message || e);
      // it's okay — user can hit "Resend" to create a new session
    }

    // Return immediately; user proceeds to OTP input screen
    return NextResponse.json({ sessionId, queued: true });
  } catch (e: any) {
    console.error('[verify/start] error:', e?.message || e);
    if (e?.message === 'RATE_LIMITED')
      return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
    if (e?.message === 'recaptcha_failed')
      return NextResponse.json({ error: 'recaptcha_failed' }, { status: 400 });
    return NextResponse.json({ error: 'start_failed' }, { status: 400 });
  } finally {
    console.log(`[verify/start] end total=${Date.now() - t0}ms`);
  }
}