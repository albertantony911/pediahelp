import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST!,
  port: Number(process.env.MAIL_PORT || 465),
  secure: process.env.MAIL_SECURE === 'true',
  auth: { user: process.env.MAIL_USER!, pass: process.env.MAIL_PASS! },
});

export async function sendEmail(to: string, subject: string, text: string) {
  await transporter.sendMail({ from: `"Verification" <${process.env.MAIL_USER!}>`, to, subject, text });
}

export async function sendOtpEmail(to: string, code: string) {
  await sendEmail(to, 'Your verification code', `Your OTP is ${code}. It expires in 10 minutes.`);
}