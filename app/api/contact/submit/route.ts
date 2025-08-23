export const runtime = 'nodejs';
export const preferredRegion = ['bom1'];

import { NextResponse } from 'next/server';
import { nowSec } from '@/lib/crypto';
import { getSession, markUsed } from '@/lib/otp-store';
import { sendContactNotification } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, name, email, phone, message, subject, pageSource = 'Contact Page' } = body || {};
    if (!sessionId || !name || !email || !message) return NextResponse.json({ error:'bad_request' }, { status:400 });

    // Validate OTP session (Redis)
    const s = await getSession(sessionId);
    if (!s) return NextResponse.json({ error:'invalid_session' }, { status:400 });
    if (!s.verified) return NextResponse.json({ error:'not_verified' }, { status:400 });
    if (s.used) return NextResponse.json({ error:'already_used' }, { status:400 });
    if (s.expiresAt < Math.floor(Date.now()/1000)) return NextResponse.json({ error:'expired' }, { status:400 });
    if (s.scope !== 'contact') return NextResponse.json({ error:'wrong_scope' }, { status:403 });

    // Send tidy HTML notification to receiver
    await sendContactNotification(
      process.env.MAIL_RECEIVER || process.env.MAIL_USER!,
      { name, email, phone, message, pageSource, sessionId, scope:'contact' }
    );

    // Mark used (fast) — we can respond success now
    await markUsed(sessionId);

    // Fire-and-forget archival (internal call)
    try {
      const site = (process.env.SITE_URL || '').replace(/\/$/,'');
      const url = `${site}${process.env.ARCHIVE_URL || '/api/internal/archive'}`;
      fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          'Authorization': `Bearer ${process.env.ARCHIVE_TOKEN || ''}`,
        },
        body: JSON.stringify({
          sessionId, name, email, phone, message, pageSource,
          subject: subject || null, createdAt: nowSec()
        }),
        // do not await
      }).catch(()=>{});
    } catch (_) {}

    return NextResponse.json({ ok: true });
  } catch (e:any) {
    console.error('[contact/submit] error:', e?.message || e);
    return NextResponse.json({ error:'submit_failed' }, { status:500 });
  }
}