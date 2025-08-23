export const runtime = 'nodejs';
export const preferredRegion = ['bom1'];

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

type ArchiveBody = {
  sessionId: string;
  name: string;
  email: string;
  phone?: string | null;
  message: string;
  pageSource?: string | null;
  subject?: string | null;
  createdAt?: number;
};

const clamp = (s: string, n: number) => (s || '').slice(0, n).trim();

export async function POST(req: Request) {
  try {
    // 🔒 Bearer auth
    const auth = req.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!token || token !== (process.env.ARCHIVE_TOKEN || '')) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as ArchiveBody;

    // ✅ Minimal validation & normalization
    const sessionId = clamp(body.sessionId, 64);
    const name = clamp(body.name, 120);
    const email = clamp((body.email || '').toLowerCase(), 160);
    const phone = clamp(body.phone || '', 32) || null;
    const message = clamp(body.message, 4000);
    const pageSource = clamp(body.pageSource || 'Contact Page', 120);
    const subject = clamp(body.subject || '', 160) || null;
    const createdAt = Number.isFinite(body.createdAt) ? body.createdAt! : Math.floor(Date.now() / 1000);

    if (!sessionId || !name || !email || !message) {
      return NextResponse.json({ error: 'bad_request' }, { status: 400 });
    }

    // Optional helpful metadata
    const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null;
    const ua = req.headers.get('user-agent') || null;

    await db.collection('contactMessages').add({
      sessionId,
      name,
      email,
      phone,
      message,
      pageSource,
      subject,
      createdAt,
      ip,
      ua,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[internal/archive] error:', e?.message || e);
    return NextResponse.json({ error: 'archive_failed' }, { status: 500 });
  }
}