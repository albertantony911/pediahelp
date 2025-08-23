import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET() {
  const t0 = Date.now();
  await db.collection('health').doc('ping').set({ at: Date.now() }, { merge: true });
  return NextResponse.json({ ok: true, ms: Date.now() - t0 });
}