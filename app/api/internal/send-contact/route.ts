export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { sendContactNotification } from '@/lib/mailer';

export async function POST(req: Request) {
  try {
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token || token !== (process.env.SEND_CONTACT_TOKEN || '')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    // expected payload shape:
    // { to, name, email, phone, message, pageSource, sessionId, scope }
    if (!payload?.to || !payload?.name || !payload?.email || !payload?.message) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    await sendContactNotification(payload.to, {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      message: payload.message,
      pageSource: payload.pageSource,
      sessionId: payload.sessionId,
      scope: payload.scope || 'contact',
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[internal/send-contact] error:', e?.message || e);
    return NextResponse.json({ error: 'send_failed' }, { status: 500 });
  }
}