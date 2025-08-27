// lib/mailer.ts
import { Resend } from 'resend';
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
const FROM_ADDR = process.env.RESEND_FROM!; // e.g. 'Blackwoodbox <no-reply@mail.blackwoodbox.com>'
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
 * Careers: link-based application
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
 * -----------------------------------------------------*/
export type DoctorReviewPayload = {
  doctorId: string;
  name: string;
  email: string;
  rating: number;
  comment: string;
  phone: string;
  reviewId?: string;
  subject?: string;
};

export async function sendDoctorReviewNotification(to: string, payload: DoctorReviewPayload) {
  await sendEmail({
    to,
    subject: payload.subject || `${BRAND} — New doctor review for ${payload.doctorId}`,
    text: doctorReviewNotifyText(payload),
    html: doctorReviewNotifyHtml(payload),
  });
}