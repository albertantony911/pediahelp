// app/api/blog-question/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { groq } from 'next-sanity';
import { createClient } from 'next-sanity';
import nodemailer from 'nodemailer';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-10-18',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN!,
});

export async function POST(req: NextRequest) {
  const { name, email, phone, question, postSlug } = await req.json();

  if (!name || !email || !phone || !question || !postSlug) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    // 1. Get post _id from slug
    const post = await client.fetch(
      groq`*[_type == "post" && slug.current == $slug][0]{ _id }`,
      { slug: postSlug }
    );

    if (!post?._id) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // 2. Create question in Sanity
    await client.create({
      _type: 'blogQuestion',
      name,
      email,
      phone,
      question,
      post: {
        _type: 'reference',
        _ref: post._id,
      },
      approved: false,
      submittedAt: new Date().toISOString(),
    });

    // 3. Email Notification
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SUPPORT_EMAIL_USER!,
        pass: process.env.SUPPORT_EMAIL_PASS!,
      },
    });

    await transporter.sendMail({
      from: `"Pediahelp Blog" <${process.env.SUPPORT_EMAIL_USER}>`,
      to: process.env.SUPPORT_EMAIL_RECEIVER!,
      subject: `📩 New Blog Question from ${name}`,
      text: `
Name: ${name}
Email: ${email}
Phone: ${phone}
Question: ${question}
From Blog: https://www.pediahelp.com/blog/${postSlug}
      `.trim(),
    });

    // 4. WhatsApp link generation
    const whatsappMessage = `Hi! I just asked a question on your blog (/blog/${postSlug}):\n\n"${question}"`;
    const whatsappLink = `https://wa.me/${process.env.SUPPORT_WHATSAPP_NUMBER?.replace('+', '')}?text=${encodeURIComponent(whatsappMessage)}`;

    return NextResponse.json({
      success: true,
      whatsappLink,
    });

  } catch (error) {
    console.error('❌ Submission failed:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}