export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { nowSec } from '@/lib/crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      sessionId,
      name,
      email,
      phone,
      message,
      subject,           // kept for future, but not needed for internal sender
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

    // Mark session used + persist the message (archive) — this is fast and durable
    await ref.update({ used: true, usedAt: nowSec() });
    await db.collection('contactMessages').add({
      sessionId,
      name,
      email: String(email).toLowerCase(),
      phone: phone || null,
      message,
      pageSource,
      subject: subject || null,
      createdAt: nowSec(),
    });

    // 🔔 Queue email in the background via internal route (don't await)
    try {
      const host = (req.headers.get('host') || '').trim();
      const proto = host.startsWith('localhost') ? 'http' : 'https';
      const base = host ? `${proto}://${host}` : (process.env.SITE_URL || '').replace(/\/$/, '');
      const url = `${base}/api/internal/send-contact`;

      // fire & forget: no await
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SEND_CONTACT_TOKEN || ''}`,
        },
        body: JSON.stringify({
          to: process.env.MAIL_RECEIVER || process.env.MAIL_USER!,
          name,
          email,
          phone,
          message,
          pageSource,
          sessionId,
          scope: 'contact',
        }),
        keepalive: true,
      }).then(r => {
        console.log('[contact/submit] queued internal send-contact status', r.status);
      }).catch(e => {
        console.error('[contact/submit] queue error:', e?.message || e);
      });
    } catch (e:any) {
      console.error('[contact/submit] enqueue failed:', e?.message || e);
    }

    // ✅ Respond immediately — UI can switch to success now
    return NextResponse.json({ ok: true, queued: true });
  } catch (e: any) {
    console.error('[contact/submit] error:', e?.message || e);
    return NextResponse.json({ error: 'submit_failed' }, { status: 500 });
  }
}