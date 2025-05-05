// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'next-sanity';
import nodemailer from 'nodemailer';

// Initialize Sanity client
const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-10-18',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN!,
});

export async function POST(req: NextRequest) {
  const { name, email, phone, message } = await req.json();

  if (!name || !email || !phone || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // 1. Save contact inquiry in Sanity
    await client.create({
      _type: 'contactMessage',
      name,
      email,
      phone,
      message,
      responded: false,
      submittedAt: new Date().toISOString(),
    });

    // 2. Email Notification
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SUPPORT_EMAIL_USER!,
        pass: process.env.SUPPORT_EMAIL_PASS!,
      },
    });

    await transporter.sendMail({
      from: `"Pediahelp Contact Form" <${process.env.SUPPORT_EMAIL_USER}>`,
      to: process.env.SUPPORT_EMAIL_RECEIVER!,
      subject: `📥 New Contact Form Submission from ${name}`,
      text: `
Name: ${name}
Email: ${email}
Phone: ${phone}
Message: ${message}
      `.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Contact submission failed:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}