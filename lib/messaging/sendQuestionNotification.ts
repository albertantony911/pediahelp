import nodemailer from 'nodemailer';

export async function sendQuestionNotification({
  name,
  email,
  phone,
  question,
  blogTitle,
}: {
  name: string;
  email: string;
  phone: string;
  question: string;
  blogTitle: string;
}) {
  // Email transporter (dev only - use env vars)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SUPPORT_EMAIL_USER,
      pass: process.env.SUPPORT_EMAIL_PASS,
    },
  });

  const subject = `📩 New Question from ${name} on blog: ${blogTitle}`;
  const text = `Name: ${name}
Email: ${email}
Phone: +91${phone}
Blog: ${blogTitle}

Question:
${question}`;

  // 1. Send email
  const mailRes = await transporter.sendMail({
    from: `"Pediahelp" <${process.env.SUPPORT_EMAIL_USER}>`,
    to: process.env.QUESTION_RECEIVER_EMAIL, // your email
    subject,
    text,
  });

  console.log('[Email] Sent:', mailRes.messageId);

  // 2. Simulate WhatsApp – open chat OR log URL
  const encodedMessage = encodeURIComponent(`👋 Hi! I just submitted a question on your blog "${blogTitle}".\n\nHere it is:\n"${question}"`);
  const whatsappLink = `https://wa.me/${process.env.SUPPORT_WHATSAPP_NUMBER}?text=${encodedMessage}`;

  console.log('[WhatsApp] Preview Link:', whatsappLink);

  return { success: true };
}