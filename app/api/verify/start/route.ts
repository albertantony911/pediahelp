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
    const { identifier, channel = 'auto', scope = 'contact', recaptchaToken, honeypot, startedAt } = await req.json();

    tick('begin');
    if (!identifier || typeof identifier !== 'string') return NextResponse.json({ error: 'bad_identifier' }, { status: 400 });
    if (!recaptchaToken) return NextResponse.json({ error: 'no_recaptcha' }, { status: 400 });
    if (honeypot) return NextResponse.json({ error: 'bot_detected' }, { status: 400 });
    if (startedAt && Date.now() - Number(startedAt) < 1200) return NextResponse.json({ error: 'too_fast' }, { status: 400 });

    const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'ip') as string;

    // Run recaptcha + ratelimits in parallel
    tick('guards_start');
    await Promise.all([
      (async () => {
        const ok = await verifyRecaptcha(recaptchaToken);
        if (!ok) throw new Error('recaptcha_failed');
      })(),
      (async () => {
        await bumpRateOrThrow(`ip:${ip}`, 3600, 50);
        await bumpRateOrThrow(`id:${identifier}`, 3600, 30);
      })(),
    ]);
    tick('guards_ok');

    const sessionId = randomId(12);
    const code = randomOtp();
    const expiresAt = nowSec() + 600;

    // Save session FIRST (fast, Redis) + stash plain code briefly
    await createSession(sessionId, {
      identifier,
      scope,
      otpHash: sha256(code),
      expiresAt,
      ip,
    });
    await setPlainCode(sessionId, code, 120);
    tick('session_created');

    // Queue async send (do not await)
    try {
      const site = (process.env.SITE_URL || '').replace(/\/$/, '');
      const url = `${site}/api/internal/send-otp`;
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SEND_TOKEN || ''}`,
        },
        body: JSON.stringify({
          sessionId,
          identifier,
          channel, // 'auto' | explicit
        }),
      }).catch(() => {});
    } catch {
      // ignore queueing errors – user can always Resend
    }

    // ✅ Return immediately so UI advances to OTP step
    return NextResponse.json({ sessionId, queued: true });
  } catch (e: any) {
    console.error('[verify/start] error:', e?.message || e);
    if (e?.message === 'RATE_LIMITED') return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
    if (e?.message === 'recaptcha_failed') return NextResponse.json({ error: 'recaptcha_failed' }, { status: 400 });
    return NextResponse.json({ error: 'start_failed' }, { status: 400 });
  } finally {
    console.log(`[verify/start] end total=${Date.now() - t0}ms`);
  }
}