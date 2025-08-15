// lib/email.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SUPPORT_EMAIL_USER,
    pass: process.env.SUPPORT_EMAIL_PASS,
  },
});

export async function sendSupportEmail({
  subject,
  replyTo,
  html,
  text,
}: {
  subject: string;
  replyTo: string;
  html: string;
  text: string;
}) {
  if (!process.env.SUPPORT_EMAIL_RECEIVER) {
    console.warn('⚠️ SUPPORT_EMAIL_RECEIVER not set, skipping email.');
    return;
  }

  return transporter.sendMail({
    from: process.env.SUPPORT_EMAIL_USER,
    to: process.env.SUPPORT_EMAIL_RECEIVER,
    replyTo,
    subject,
    html,
    text,
  });
}
