export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { nowSec } from '@/lib/crypto';
import { sendContactNotification } from '@/lib/mailer';

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

    const ref = db.collection('otpSessions').doc(sessionId);
    const snap = await ref.get();
    if (!snap.exists) {
      console.warn('[contact/submit] invalid_session');
      return NextResponse.json({ error: 'invalid_session' }, { status: 400 });
    }

    const s = snap.data()!;
    if (s.expiresAt < nowSec()) return NextResponse.json({ error: 'expired' }, { status: 400 });
    if (!s.verified) return NextResponse.json({ error: 'not_verified' }, { status: 400 });
    if (s.used) return NextResponse.json({ error: 'already_used' }, { status: 400 });
    if (s.scope !== 'contact') return NextResponse.json({ error: 'wrong_scope' }, { status: 403 });

    // Mark used *before* sending mail so a page unload doesn’t duplicate
    await ref.update({ used: true, usedAt: nowSec() });
    tick('session_marked_used');

    // Archive first; respond to client fast even if mail later fails
    await db.collection('contactMessages').add({
      sessionId, name, email, phone: phone || null, message,
      pageSource, subject: subject || null, createdAt: nowSec(),
    });
    tick('archived');

    // Send email (log errors but don’t fail the request)
    try {
      await sendContactNotification(
        process.env.MAIL_RECEIVER || process.env.MAIL_USER!,
        { name, email, phone, message }
      );
      tick('mail_sent');
    } catch (e: any) {
      console.error('[contact/submit] mailer_error:', e?.message || e);
      // Still return ok — we archived; you can re-deliver later if needed
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