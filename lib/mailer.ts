// lib/mailer.ts — MSG91 Email (HTTP API) drop-in
import { otpEmailHtml, otpEmailText, contactNotifyHtml, contactNotifyText } from './email-templates';

const AUTH_KEY = process.env.MSG91_AUTH_KEY!;
const FROM_ADDR = process.env.MSG91_FROM!;          // e.g. no-reply@mail.blackwoodbox.com
const FROM_NAME = process.env.MSG91_FROM_NAME || (process.env.BRAND_NAME || 'Pediahelp');
const REPLY_TO  = process.env.MSG91_REPLY_TO || undefined;

// Minimal client for MSG91 Email v5
async function msg91SendEmail(opts: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  const { to, subject, text, html } = opts;

  const payload = {
    recipients: [
      {
        to: [{ email: to }],
        // per-recipient vars if you ever need them:
        // variables: { someVar: 'value' }
      },
    ],
    from: {
      email: FROM_ADDR,
      name: FROM_NAME,
    },
    subject,
    // MSG91 supports either `text` or `html` or both
    text: text || undefined,
    html: html || undefined,
    reply_to: REPLY_TO ? [{ email: REPLY_TO }] : undefined,
    // If you enable/need template IDs later:
    // template_id: 'TEMPLATE_ID',
  };

  const res = await fetch('https://api.msg91.com/api/v5/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: AUTH_KEY,
    },
    body: JSON.stringify(payload),
  });

  // MSG91 usually returns { status: "success", message: "...", data: {...} } or an error payload
  const j = await res.json().catch(() => ({}));
  const ok = res.ok && (j?.status === 'success' || j?.success === true);

  if (!ok) {
    const errMsg =
      j?.message ||
      j?.error ||
      `MSG91 email send failed (HTTP ${res.status})`;
    throw new Error(errMsg);
  }

  return j;
}

async function sendEmail(opts: { to: string; subject: string; text: string; html?: string }) {
  if (!AUTH_KEY) throw new Error('Missing MSG91_AUTH_KEY');
  if (!FROM_ADDR) throw new Error('Missing MSG91_FROM');
  return msg91SendEmail(opts);
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