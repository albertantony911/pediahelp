export const runtime = 'nodejs';
export const preferredRegion = ['bom1'];

import { NextResponse } from 'next/server';
import { verifyCode } from '@/lib/otp-store';

export async function POST(req: Request) {
  const { sessionId, code } = await req.json();
  if (!sessionId || !code) return NextResponse.json({ error:'bad_request' }, { status:400 });

  const result = await verifyCode(sessionId, code);
  if (!result.ok) return NextResponse.json({ error: result.err }, { status: 400 });

  return NextResponse.json({ ok: true });
}