// lib/mailer.ts
import { Resend } from 'resend';
import { otpEmailHtml, otpEmailText, contactNotifyHtml, contactNotifyText } from './email-templates';

const resend = new Resend(process.env.RESEND_API_KEY!);

const BRAND = process.env.BRAND_NAME || 'Pediahelp';
const FROM_ADDR = process.env.RESEND_FROM!;           // e.g. 'Blackwoodbox <no-reply@mail.blackwoodbox.com>'
const REPLY_TO = process.env.RESEND_REPLY_TO || undefined;

/* -------------------------------------------------------
 * Core sender
 * -----------------------------------------------------*/
type SendEmailOpts = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

async function sendEmail(opts: SendEmailOpts) {
  const { to, subject, text, html } = opts;

  const result = await resend.emails.send({
    from: FROM_ADDR,
    to: [to],
    subject,
    text,
    html,
    replyTo: REPLY_TO ? [REPLY_TO] : undefined,
    // headers: { 'X-Entity-Ref-ID': crypto.randomUUID() }, // optional idempotency tag
  });

  if ((result as any)?.error) {
    // Resend SDK returns { error } on failure
    const err = (result as any).error;
    throw new Error(err?.message || 'RESEND_SEND_FAILED');
  }
}

/* -------------------------------------------------------
 * OTP (email channel)
 * -----------------------------------------------------*/
export async function sendOtpEmail(to: string, code: string, minutes = 10) {
  await sendEmail({
    to,
    subject: `${BRAND} verification code: ${code}`,
    text: otpEmailText(code, minutes),
    html: otpEmailHtml(code, minutes),
  });
}

/* -------------------------------------------------------
 * Contact notification (to you)
 * -----------------------------------------------------*/
export async function sendContactNotification(to: string, payload: {
  name: string; email: string; phone?: string; message: string;
}) {
  await sendEmail({
    to,
    subject: `New ${BRAND} contact: ${payload.name}`,
    text: contactNotifyText(payload),
    html: contactNotifyHtml(payload),
  });
}

/* -------------------------------------------------------
 * Careers: link-based application
 *   - Sends a clean email to your careers inbox with the
 *     candidate’s details and a single share link to resume.
 * -----------------------------------------------------*/
type CareerBasics = {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  message?: string;
};

type ResumeLink = {
  url: string;              // e.g. https://drive.google.com/...
  filename?: string;        // optional hint to display
  sizeLabel?: string;       // optional e.g. "PDF · 1.2 MB"
};

export async function sendCareerApplicationLink(
  to: string,
  applicant: CareerBasics,
  resume: ResumeLink
) {
  const subject =
    `${BRAND} — Career Application: ${applicant.name}` +
    (applicant.role ? ` (${applicant.role})` : '');

  const safe = (s: string) =>
    s.replace(/[&<>"']/g, (ch) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch] as string));

  const filenamePart = resume.filename ? ` — ${resume.filename}` : '';
  const sizePart = resume.sizeLabel ? ` (${resume.sizeLabel})` : '';

  const textLines = [
    `${BRAND} — Career Application`,
    `Name: ${applicant.name}`,
    `Email: ${applicant.email}`,
    `Phone: ${applicant.phone || '—'}`,
    `Role: ${applicant.role || '—'}`,
    ``,
    `Message:`,
    `${applicant.message || '—'}`,
    ``,
    `Resume link${filenamePart}${sizePart}:`,
    `${resume.url}`,
  ].join('\n');

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:680px;margin:auto;padding:24px;color:#0b0d11;">
      <h1 style="font-size:18px;margin:0 0 12px 0;color:#264E53">${safe(BRAND)} — Career Application</h1>
      <table style="font-size:14px;border-collapse:collapse;margin-bottom:12px">
        <tr><td style="color:#80935a;width:120px;padding:4px 0">Name</td><td style="padding:4px 0">${safe(applicant.name)}</td></tr>
        <tr><td style="color:#80935a;padding:4px 0">Email</td><td style="padding:4px 0">${safe(applicant.email)}</td></tr>
        <tr><td style="color:#80935a;padding:4px 0">Phone</td><td style="padding:4px 0">${safe(applicant.phone || '—')}</td></tr>
        <tr><td style="color:#80935a;padding:4px 0">Role</td><td style="padding:4px 0">${safe(applicant.role || '—')}</td></tr>
      </table>

      <div style="font-size:12px;color:#80935a;margin-bottom:6px">Message</div>
      <div style="white-space:pre-wrap">${safe(applicant.message || '—')}</div>

      <div style="height:16px"></div>

      <div style="font-size:12px;color:#80935a;margin-bottom:6px">Resume</div>
      <div>
        <a href="${resume.url}" style="display:inline-block;padding:10px 14px;background:#264E53;color:#fff;border-radius:8px;text-decoration:none;font-size:14px">
          Open resume${filenamePart ? `: ${safe(filenamePart.replace(/^ — /, ''))}` : ''}${sizePart}
        </a>
        <div style="font-size:12px;color:#555;margin-top:6px;word-break:break-all">
          ${safe(resume.url)}
        </div>
      </div>
    </div>
  `;

  await sendEmail({
    to,
    subject,
    text: textLines,
    html,
  });
}