// lib/email.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.SUPPORT_EMAIL_USER,
    pass: process.env.SUPPORT_EMAIL_PASS,
  },
});

export async function sendSupportEmail({
  subject,
  message,
  name,
  email,
  phone,
  html,
  replyTo,
}: {
  subject: string;
  message: string;
  name?: string;
  email?: string;
  phone?: string;
  html?: string;
  replyTo?: string; // ✅ optional now
}) {
  if (!process.env.SUPPORT_EMAIL_RECEIVER) {
    console.warn("⚠️ SUPPORT_EMAIL_RECEIVER not set, skipping email.");
    return;
  }

  const text = message || `
From: ${name || "N/A"}
Email: ${email || "N/A"}
Phone: ${phone || "N/A"}

Message:
${message || ""}
  `;

  const htmlBody =
    html ||
    `
    <p><strong>From:</strong> ${name || "N/A"}</p>
    <p><strong>Email:</strong> ${email || "N/A"}</p>
    <p><strong>Phone:</strong> ${phone || "N/A"}</p>
    <p><strong>Message:</strong></p>
    <p>${message || ""}</p>
  `;

  return transporter.sendMail({
    from: process.env.SUPPORT_EMAIL_USER,
    to: process.env.SUPPORT_EMAIL_RECEIVER,
    ...(replyTo ? { replyTo } : {}), // ✅ only include if set
    subject,
    text,
    html: htmlBody,
  });
}
