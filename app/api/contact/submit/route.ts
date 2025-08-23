export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { nowSec } from '@/lib/crypto';
import { sendContactNotification } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      sessionId,
      name,
      email,
      phone,
      message,
      subject,
      pageSource = 'Contact Page',
    } = body || {};

    if (!sessionId || !name || !email || !message) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    // Validate OTP session
    const ref = db.collection('otpSessions').doc(sessionId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'invalid_session' }, { status: 400 });

    const s = snap.data()!;
    if (!s.verified) return NextResponse.json({ error: 'not_verified' }, { status: 400 });
    if (s.used) return NextResponse.json({ error: 'already_used' }, { status: 400 });
    if (s.expiresAt < nowSec()) return NextResponse.json({ error: 'expired' }, { status: 400 });
    if (s.scope !== 'contact') return NextResponse.json({ error: 'wrong_scope' }, { status: 403 });

    // Send the polished HTML notification to your inbox
    await sendContactNotification(
      process.env.MAIL_RECEIVER || process.env.MAIL_USER!,
      {
        name,
        email,
        phone,
        message,
        pageSource,
        sessionId,
        scope: 'contact',
      }
    );

    // Mark session used + persist the message
    await ref.update({ used: true, usedAt: nowSec() });
    await db.collection('contactMessages').add({
      sessionId,
      name,
      email,
      phone: phone || null,
      message,
      pageSource,
      subject: subject || null,
      createdAt: nowSec(),
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[contact/submit] error:', e?.message || e);
    return NextResponse.json({ error: 'submit_failed' }, { status: 500 });
  }
}