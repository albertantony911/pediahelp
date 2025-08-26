export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { sendOtpEmail } from '@/lib/mailer';

export async function GET() {
  try {
    await sendOtpEmail(
      process.env.MAIL_RECEIVER || process.env.MAIL_USER!,
      '123456', // test code
      10 // minutes (optional)
    );
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ ok: false, err: e.message }, { status: 500 });
  }
}