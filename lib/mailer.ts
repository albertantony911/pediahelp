// lib/mailer.ts
import { Resend } from 'resend';
import { otpEmailHtml, otpEmailText, contactNotifyHtml, contactNotifyText } from './email-templates';

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM_NAME = process.env.BRAND_NAME || 'Pediahelp';
const FROM_ADDR = process.env.RESEND_FROM!;      // e.g. "Pediahelp <hello@send.pediahelp.in>"
const REPLY_TO = process.env.RESEND_REPLY_TO || undefined;

async function sendEmail(opts: { to: string; subject: string; text: string; html?: string }) {
  const { to, subject, text, html } = opts;

  const result = await resend.emails.send({
    from: FROM_ADDR,
    to: [to],
    subject,
    text,
    html,
    replyTo: REPLY_TO ? [REPLY_TO] : undefined,
    // headers: { 'X-Entity-Ref-ID': crypto.randomUUID() }, // optional idempotency tagging
  });

  if (result.error) {
    throw new Error(result.error.message || 'RESEND_SEND_FAILED');
  }
}

// OTP to the user (email channel)
export async function sendOtpEmail(to: string, code: string, minutes = 10) {
  await sendEmail({
    to,
    subject: `${FROM_NAME} verification code: ${code}`,
    text: otpEmailText(code, minutes),
    html: otpEmailHtml(code, minutes),
  });
}

// Notification to you (receiver)
export async function sendContactNotification(to: string, payload: {
  name: string; email: string; phone?: string; message: string;
}) {
  await sendEmail({
    to,
    subject: `New ${FROM_NAME} contact: ${payload.name}`,
    text: contactNotifyText(payload),
    html: contactNotifyHtml(payload),
  });
}