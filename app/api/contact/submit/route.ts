// app/api/contact/submit/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { nowSec } from '@/lib/crypto';
import { sendContactNotification } from '@/lib/mailer';
import { getSession, markUsed } from '@/lib/otp-store-redis';

export async function POST(req: Request) {
  const t0 = Date.now();
  const tick = (l: string) => console.log(`[contact/submit] ${l} +${Date.now() - t0}ms`);

  try {
    tick('begin');
    const body = await req.json();
    const { sessionId, name, email, phone, message, subject, pageSource = 'Contact Page' } = body || {};
    console.log('[contact/submit] payload:', { sessionId, name, email, hasMsg: !!message });

    if (!sessionId || !name || !email || !message) {
      console.warn('[contact/submit] bad_request');
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    // Validate OTP session in Redis
    const s = await getSession(sessionId);
    if (!s)                         return NextResponse.json({ error: 'invalid_session' }, { status: 400 });
    if (s.expiresAt < nowSec())     return NextResponse.json({ error: 'expired' }, { status: 400 });
    if (!s.verified)                return NextResponse.json({ error: 'not_verified' }, { status: 400 });
    if (s.used)                     return NextResponse.json({ error: 'already_used' }, { status: 400 });
    if (s.scope !== 'contact')      return NextResponse.json({ error: 'wrong_scope' }, { status: 403 });

    // Mark used BEFORE archive/send (avoid dupes on reload)
    await markUsed(sessionId);
    tick('session_marked_used');

    // Archive (Firestore) for durability
    await db.collection('contactMessages').add({
      sessionId, name, email, phone: phone || null, message,
      pageSource, subject: subject || null, createdAt: nowSec(),
    });
    tick('archived');

    // Send mail (Resend)
    try {
      await sendContactNotification(
        process.env.MAIL_RECEIVER || process.env.MAIL_USER || email, // fallback (or set explicit receiver env)
        { name, email, phone, message }
      );
      tick('mail_sent');
    } catch (e: any) {
      console.error('[contact/submit] mailer_error:', e?.message || e);
      return NextResponse.json({ ok: true, mail: 'failed' });
    }

    return NextResponse.json({ ok: true, mail: 'sent' });
  } catch (e: any) {
    console.error('[contact/submit] error:', e?.message || e);
    return NextResponse.json({ error: 'submit_failed' }, { status: 500 });
  } finally {
    console.log(`[contact/submit] end total=${Date.now() - t0}ms`);
  }
}