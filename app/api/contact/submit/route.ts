export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { nowSec } from '@/lib/crypto';
import { sendEmail } from '@/lib/mailer';

export async function POST(req: Request) {
  const { sessionId, name, email, phone, message, subject } = await req.json();

  if (!sessionId || !name || !email || !message) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const ref = db.collection('otpSessions').doc(sessionId);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: 'invalid_session' }, { status: 400 });
  const s = snap.data()!;

  if (!s.verified) return NextResponse.json({ error: 'not_verified' }, { status: 400 });
  if (s.used) return NextResponse.json({ error: 'already_used' }, { status: 400 });
  if (s.expiresAt < nowSec()) return NextResponse.json({ error: 'expired' }, { status: 400 });
  if (s.scope !== 'contact') return NextResponse.json({ error: 'wrong_scope' }, { status: 403 });

  // Email to your inbox
  await sendEmail(
  process.env.MAIL_RECEIVER || process.env.MAIL_USER!,
  subject || `New contact from ${name}`,
  `From: ${name} <${email}>\nPhone: ${phone || 'N/A'}\n\n${message}`
);

  await ref.update({ used: true, usedAt: nowSec() });
  await db.collection('contactMessages').add({
    sessionId, name, email, phone, message, createdAt: nowSec()
  });

  return NextResponse.json({ ok: true });
}