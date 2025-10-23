// lib/mailer.ts
import { Resend } from 'resend';
import crypto from 'crypto';

import {
  otpEmailHtml,
  otpEmailText,
  contactNotifyHtml,
  contactNotifyText,
  careerApplicationLinkHtml,
  careerApplicationLinkText,
  doctorReviewNotifyHtml,
  doctorReviewNotifyText,
  blogCommentNotifyHtml,
  blogCommentNotifyText,
} from './email-templates';

const resend = new Resend(process.env.RESEND_API_KEY!);

const BRAND = process.env.BRAND_NAME || 'Pediahelp';
const FROM_ADDR = process.env.RESEND_FROM!; // e.g. 'Pediahelp <hello@send.pediahelp.in>'
const REPLY_TO = process.env.RESEND_REPLY_TO || undefined;

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

/* -------------------- OTP (email) -------------------- */
export async function sendOtpEmail(to: string, code: string, minutes = 10) {
  await sendEmail({
    to,
    subject: `${BRAND} verification code: ${code}`,
    text: otpEmailText(code, minutes),
    html: otpEmailHtml(code, minutes),
  });
}

/* -------------------- Contact notify -------------------- */
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

/* -------------------- Career (link) -------------------- */
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

/* -------------------- Doctor review notify -------------------- */
export type DoctorReviewPayload = {
  doctorName?: string;
  doctorId?: string; // tolerated for fallback only
  name: string;
  email: string;
  rating: number;
  comment: string;
  phone: string;
  subject?: string;
};

export async function sendDoctorReviewNotification(to: string, payload: DoctorReviewPayload) {
  const doctorName =
    (payload.doctorName && payload.doctorName.trim()) ||
    (payload.doctorId ? `Doctor ${payload.doctorId}` : 'Doctor');

  const subject = payload.subject || `${BRAND} — New review for Dr. ${doctorName}`;
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

/* -------------------- Blog comment notify (final) -------------------- */
/**
 * This is the single canonical version we use everywhere.
 * It builds an approval link that hits /api/comments/approve?token=...&sig=...
 * Signing secret: COMMENT_APPROVE_SECRET
 * Public site URL: NEXT_PUBLIC_SITE_URL
 */
// --- only replace this function in lib/mailer.ts ---
function signApprovePayload(payload: { id: string; slug: string }) {
  const secret = process.env.COMMENT_APPROVE_SECRET!;
  const json = JSON.stringify(payload);
  const sig = require('crypto').createHmac('sha256', secret).update(json).digest('hex');
  return { token: Buffer.from(json).toString('base64url'), sig };
}

export async function sendBlogCommentNotification(to: string, payload: {
  commentId: string;
  slug: string;
  postTitle: string;
  name: string;
  email: string;
  phone: string;
  question: string;
}) {
  // ✅ Don’t crash if base URL is missing — just omit the approve button
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    '';

  let approveUrl: string | undefined;
  if (base && process.env.COMMENT_APPROVE_SECRET) {
    const { token, sig } = signApprovePayload({ id: payload.commentId, slug: payload.slug });
    approveUrl = `${base}/api/comments/approve?token=${token}&sig=${sig}`;
  }

  const subject = `${process.env.BRAND_NAME || 'Pediahelp'} — New comment on "${payload.postTitle}"`;

  await sendEmail({
    to,
    subject,
    text: blogCommentNotifyText({
      postTitle: payload.postTitle,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      question: payload.question,
      approveUrl,
    }),
    html: blogCommentNotifyHtml({
      postTitle: payload.postTitle,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      question: payload.question,
      approveUrl,
    }),
  });
}