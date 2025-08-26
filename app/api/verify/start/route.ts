// app/api/verify/start/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { bumpRateOrThrow } from '@/lib/ratelimit';
import { randomOtp, sha256, randomId, nowSec } from '@/lib/crypto';
import { sendWithPolicy, Channel } from '@/lib/otp-channels';
import { createSession, setChannelUsed } from '@/lib/otp-store-redis';

export async function POST(req: Request) {
  const t0 = Date.now();
  const tick = (l:string)=>console.log(`[verify/start] ${l} +${Date.now()-t0}ms`);

  try {
    tick('begin');
    const { identifier, channel='auto', scope='contact', recaptchaToken, honeypot, startedAt } = await req.json();

    if (!identifier || typeof identifier !== 'string') { tick('bad_identifier'); return NextResponse.json({ error:'bad_identifier' },{status:400}); }
    if (!recaptchaToken) { tick('no_recaptcha'); return NextResponse.json({ error:'no_recaptcha' },{status:400}); }
    if (honeypot) { tick('bot_detected'); return NextResponse.json({ error:'bot_detected' },{status:400}); }
    if (startedAt && Date.now() - Number(startedAt) < Number(process.env.START_MIN_DELAY_MS || 1200)) { tick('too_fast'); return NextResponse.json({ error:'too_fast' },{status:400}); }

    const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'ip') as string;

    // guards
    tick('guards_start');
    await Promise.all([
      (async () => {
        const ok = await Promise.race([
          verifyRecaptcha(recaptchaToken),
          new Promise<boolean>((_,rej)=>setTimeout(()=>rej(new Error('RECAPTCHA_TIMEOUT')), 4000)),
        ]).catch(() => false);
        if (!ok) throw new Error('recaptcha_failed');
      })(),
      (async () => {
        try {
          const ipMax = Number(process.env.RL_IP_MAX || 50);
          const idMax = Number(process.env.RL_ID_MAX || 30);
          await bumpRateOrThrow(`otp:ip:${ip}`, 3600, ipMax);
          await bumpRateOrThrow(`otp:id:${identifier}`, 3600, idMax);
        } catch (e:any) {
          if (e?.message === 'RATE_LIMITED') throw e;
          tick('ratelimit_soft_fail');
        }
      })(),
    ]);
    tick('guards_ok');

    // session + code
    const sessionId = randomId(12);
    const code = randomOtp();
    const expiresAt = nowSec() + 600;
    const effectiveChannel: Channel = process.env.EMAIL_ONLY === 'true' ? 'email' : (channel as Channel);

    // save session in Redis
    await createSession(sessionId, {
      identifier, scope, otpHash: sha256(code), expiresAt, ip,
    });
    tick('session_saved');

    // FAST mode -> queue send
    if (process.env.FAST_SEND === 'true') {
      (async () => {
        try {
          const chUsed = await sendWithPolicy(identifier, code, effectiveChannel);
          await setChannelUsed(sessionId, chUsed);
          console.log('[verify/start:bg] sent ok via', chUsed);
        } catch (e:any) {
          console.error('[verify/start:bg] send failed:', e?.message || e);
        }
      })();
      return NextResponse.json({ sessionId, channelUsed: null, queued: true });
    }

    // Synchronous send
    tick('otp_send_start');
    const channelUsed = await Promise.race([
      sendWithPolicy(identifier, code, effectiveChannel),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('OTP_SEND_TIMEOUT')), 8000)),
    ]);
    tick('otp_sent');

    await setChannelUsed(sessionId, channelUsed);
    tick('session_updated');

    return NextResponse.json({ sessionId, channelUsed });
  } catch (e:any) {
    const msg = e?.message || 'start_failed';
    console.error('[verify/start] error:', msg);
    if (msg === 'OTP_SEND_TIMEOUT') return NextResponse.json({ error:'otp_delivery_timeout' }, { status: 504 });
    if (msg === 'RATE_LIMITED')     return NextResponse.json({ error:'RATE_LIMITED' }, { status: 429 });
    if (msg === 'recaptcha_failed') return NextResponse.json({ error:'recaptcha_failed' }, { status: 400 });
    return NextResponse.json({ error: msg }, { status: 400 });
  } finally {
    console.log(`[verify/start] end total=${Date.now()-t0}ms`);
  }
}