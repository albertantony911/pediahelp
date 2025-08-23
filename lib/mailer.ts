import nodemailer from 'nodemailer';
import { otpEmailHtml, otpEmailText, contactNotifyHtml, contactNotifyText } from './email-templates';

const USE_STARTTLS = process.env.MAIL_PORT ? Number(process.env.MAIL_PORT) === 587 : true;

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.MAIL_PORT || (USE_STARTTLS ? 587 : 465)),
  secure: !USE_STARTTLS,                 // false for 587 (STARTTLS), true for 465
  auth: { user: process.env.MAIL_USER!, pass: process.env.MAIL_PASS! },
  pool: true,
  maxConnections: 3,
  maxMessages: 30,
  // slightly relaxed timeouts to reduce random timeouts
  connectionTimeout: 8000,
  greetingTimeout: 5000,
  socketTimeout: 10000,
  tls: { servername: 'smtp.gmail.com' },
});

const FROM_NAME = process.env.BRAND_NAME || 'PediaHelp';

export async function sendEmail(opts: { to: string; subject: string; text: string; html?: string }) {
  const { to, subject, text, html } = opts;
  await transporter.sendMail({
    from: `"${FROM_NAME}" <${process.env.MAIL_USER!}>`,
    to,
    subject,
    text,
    html,
  });
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
  name: string; email: string; phone?: string; message: string; pageSource?: string; sessionId?: string; scope?: string;
}) {
  await sendEmail({
    to,
    subject: `New ${FROM_NAME} contact: ${payload.name}`,
    text: contactNotifyText(payload),
    html: contactNotifyHtml(payload),
  });
}