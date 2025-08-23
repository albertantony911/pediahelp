export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mailer';

export async function GET() {
  try {
    await sendEmail(
      process.env.MAIL_RECEIVER || process.env.MAIL_USER!,
      'SMTP test ✅',
      'If you got this, Gmail SMTP is working.'
    );
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ ok: false, error: e.message || 'smtp_failed' }, { status: 500 });
  }
}