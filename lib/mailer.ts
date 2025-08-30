// lib/mailer.ts
import { Resend } from 'resend';
import { signApprovalToken } from './approval';
import {
  otpEmailHtml,
  otpEmailText,
  contactNotifyHtml,
  contactNotifyText,
  careerApplicationLinkHtml,
  careerApplicationLinkText,
  doctorReviewNotifyHtml,
  doctorReviewNotifyText,
} from './email-templates';

const resend = new Resend(process.env.RESEND_API_KEY!);

const BRAND = process.env.BRAND_NAME || 'Pediahelp';
const FROM_ADDR = process.env.RESEND_FROM!; // e.g. 'Pediahelp <hello@send.pediahelp.in>'
const REPLY_TO = process.env.RESEND_REPLY_TO || undefined;

/* -------------------------------------------------------
 * Core sender (unchanged)
 * -----------------------------------------------------*/
type SendEmailOpts = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

async function sendEmail({ to, subject, text, html }: SendEmailOpts) {
  const result = await resend.emails.send({
    from: FROM_ADDR,
    to: [to],
    subject,
    text,
    html,
    replyTo: REPLY_TO ? [REPLY_TO] : undefined,
  });

  if ((result as any)?.error) {
    const err = (result as any).error;
    throw new Error(err?.message || 'RESEND_SEND_FAILED');
  }
}

/* -------------------------------------------------------
 * OTP (email channel)  — unchanged
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
 * Contact notification (to you) — unchanged
 * -----------------------------------------------------*/
export async function sendContactNotification(to: string, payload: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}) {
  await sendEmail({
    to,
    subject: `New ${BRAND} contact: ${payload.name}`,
    text: contactNotifyText(payload),
    html: contactNotifyHtml(payload),
  });
}

/* -------------------------------------------------------
 * Careers: link-based application — unchanged
 * -----------------------------------------------------*/
type CareerBasics = {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  message?: string;
};
type ResumeLink = { url: string; filename?: string; sizeLabel?: string };

export async function sendCareerApplicationLink(
  to: string,
  applicant: CareerBasics,
  resume: ResumeLink
) {
  const subject = `${BRAND} — Career Application: ${applicant.name}${applicant.role ? ` (${applicant.role})` : ''}`;

  await sendEmail({
    to,
    subject,
    text: careerApplicationLinkText(applicant, resume),
    html: careerApplicationLinkHtml(applicant, resume),
  });
}

/* -------------------------------------------------------
 * Doctor Review notification (to you)
 *   - Backward compatible with old callers that send doctorId
 *   - Emails use doctorName; reviewId is never shown
 * -----------------------------------------------------*/
export type DoctorReviewPayload = {
  doctorName?: string;      // ✅ preferred
  doctorId?: string;        // (legacy) tolerated for subject fallback only
  name: string;
  email: string;
  rating: number;
  comment: string;
  phone: string;            // 10 digits (we show +91 in template text)
  subject?: string;
};

export async function sendDoctorReviewNotification(to: string, payload: DoctorReviewPayload) {
  const doctorName =
    (payload.doctorName && payload.doctorName.trim()) ||
    (payload.doctorId ? `Doctor ${payload.doctorId}` : 'Doctor');

  const subject = payload.subject || `${BRAND} — New review for Dr. ${doctorName}`;

  // Templates expect doctorName (not ID), and we never pass a reviewId.
  const tmplPayload = {
    doctorName,
    name: payload.name,
    email: payload.email,
    phone: payload.phone,
    rating: payload.rating,
    comment: payload.comment,
  };

  await sendEmail({
    to,
    subject,
    text: doctorReviewNotifyText(tmplPayload),
    html: doctorReviewNotifyHtml(tmplPayload),
  });
}


// --- add near other exports in lib/mailer.ts ---

export async function sendBlogCommentNotification(to: string, payload: {
  postTitle: string;
  name: string;
  email: string;
  phone: string;
  question: string;
  docId?: string; // optional: if provided, include approve button
}) {
  const subject = `${BRAND} — New comment on "${payload.postTitle}"`;

  // Approve link (if docId present)
  let approveLink: string | null = null;
  if (payload.docId && process.env.NEXT_PUBLIC_BASE_URL && process.env.APPROVAL_SECRET) {
    const token = signApprovalToken(payload.docId, 'blogComment.approve', 60 * 60); // 1h
    approveLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/blog-comments/approve?id=${encodeURIComponent(payload.docId)}&token=${encodeURIComponent(token)}`;
  }

  const text =
`New blog comment:

Post: ${payload.postTitle}
From: ${payload.name} <${payload.email}> (+91 ${payload.phone})
---
${payload.question}

${approveLink ? `Approve: ${approveLink}` : ''}`.trim();

  const html =
`<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;line-height:1.4">
  <h2 style="margin:0 0 12px">New blog comment</h2>
  <p><strong>Post:</strong> ${payload.postTitle}</p>
  <p><strong>From:</strong> ${payload.name} &lt;${payload.email}&gt; (+91 ${payload.phone})</p>
  <pre style="white-space:pre-wrap;background:#f7f7f9;padding:12px;border-radius:8px;border:1px solid #eee">${payload.question.replace(/</g,'&lt;')}</pre>
  ${approveLink ? `
    <div style="margin-top:16px">
      <a href="${approveLink}" style="background:#16a34a;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;display:inline-block">Approve Comment</a>
    </div>` : ''}
</div>`;

  await sendEmail({ to, subject, text, html });
}