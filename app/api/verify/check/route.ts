// app/api/verify/check/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { verifyAndBump } from '@/lib/otp-store-redis';

export async function POST(req: Request) {
  const { sessionId, otp, code } = await req.json();
  const provided = otp || code;

  if (!sessionId || !/^\d{6}$/.test(provided)) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  const r = await verifyAndBump(sessionId, provided);
  if (!r.ok) return NextResponse.json({ error: r.err }, { status: r.err === 'too_many_attempts' ? 429 : 400 });

  return NextResponse.json({ ok: true, scope: r.scope });
}