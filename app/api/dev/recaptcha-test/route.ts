import { NextResponse } from 'next/server';
import { verifyRecaptcha } from '@/lib/recaptcha';
export async function POST(req: Request) {
  const { token } = await req.json();
  const ok = await verifyRecaptcha(token);
  return NextResponse.json({ ok });
}