export const runtime = 'nodejs';
export const preferredRegion = ['bom1'];

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    // 🔒 Authorization
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token || token !== (process.env.ARCHIVE_TOKEN || '')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const { sessionId, name, email, phone, message, pageSource, subject, createdAt } =
      await req.json();

    if (!sessionId || !name || !email || !message) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    // Archive into Firestore
    await db.collection('contactMessages').add({
      sessionId,
      name,
      email,
      phone: phone || null,
      message,
      pageSource: pageSource || 'Contact Page',
      subject: subject || null,
      createdAt: createdAt || Math.floor(Date.now() / 1000),
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[internal/archive] error:', e?.message || e);
    return NextResponse.json({ error: 'archive_failed' }, { status: 500 });
  }
}