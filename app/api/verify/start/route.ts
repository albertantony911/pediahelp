export const runtime = 'nodejs';
export const preferredRegion = ['bom1'];

import { NextResponse } from 'next/server';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { bumpRateOrThrow } from '@/lib/ratelimit';
import { randomOtp, sha256, randomId, nowSec } from '@/lib/crypto';
import { createSession, setChannelUsed } from '@/lib/otp-store';
import { sendWithPolicy, Channel } from '@/lib/otp-channels';

export async function POST(req: Request) {
  const t0 = Date.now();
  const tick = (l:string)=>console.log(`[verify/start] ${l} +${Date.now()-t0}ms`);

  try {
    const { identifier, channel='auto', scope='contact', recaptchaToken, honeypot, startedAt } = await req.json();

    tick('begin');
    if (!identifier || typeof identifier !== 'string') return NextResponse.json({ error:'bad_identifier' },{ status:400 });
    if (!recaptchaToken) return NextResponse.json({ error:'no_recaptcha' },{ status:400 });
    if (honeypot) return NextResponse.json({ error:'bot_detected' },{ status:400 });
    if (startedAt && Date.now() - Number(startedAt) < 1200) return NextResponse.json({ error:'too_fast' },{ status:400 });

    const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'ip') as string;

    // Run recaptcha + ratelimits in parallel
    tick('guards_start');
    await Promise.all([
      (async () => {
        const ok = await verifyRecaptcha(recaptchaToken);
        if (!ok) throw new Error('recaptcha_failed');
      })(),
      (async () => {
        await bumpRateOrThrow(`ip:${ip}`, 3600, 5);
        await bumpRateOrThrow(`id:${identifier}`, 3600, 3);
      })()
    ]);
    tick('guards_ok');

    const sessionId = randomId(12);
    const code = randomOtp();
    const expiresAt = nowSec() + 600;

    // Save session FIRST (fast, Redis)
    await createSession(sessionId, {
      identifier,
      scope,
      otpHash: sha256(code),
      expiresAt,
      ip,
    });
    tick('session_created');

    // Send OTP (8s cap)
    const effectiveChannel: Channel = process.env.EMAIL_ONLY === 'true' ? 'email' : (channel as Channel);
    const channelUsed = await Promise.race([
      sendWithPolicy(identifier, code, effectiveChannel),
      new Promise<never>((_r, rej) => setTimeout(() => rej(new Error('OTP_SEND_TIMEOUT')), 8000)),
    ]);
    tick('otp_sent');

    await setChannelUsed(sessionId, channelUsed);
    tick('session_channel_set');

    return NextResponse.json({ sessionId, channelUsed });
  } catch (e:any) {
    console.error('[verify/start] error:', e?.message || e);
    if (e?.message === 'RATE_LIMITED') return NextResponse.json({ error:'RATE_LIMITED' }, { status:429 });
    if (e?.message === 'recaptcha_failed') return NextResponse.json({ error:'recaptcha_failed' }, { status:400 });
    if (e?.message === 'OTP_SEND_TIMEOUT') return NextResponse.json({ error:'otp_delivery_timeout' }, { status:504 });
    return NextResponse.json({ error:'start_failed' }, { status:400 });
  } finally {
    console.log(`[verify/start] end total=${Date.now()-t0}ms`);
  }
}