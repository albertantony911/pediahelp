import { NextRequest, NextResponse } from 'next/server';
import { groq } from 'next-sanity';
import { createClient } from 'next-sanity';
import nodemailer from 'nodemailer';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 10;

// Validate environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SANITY_PROJECT_ID',
  'NEXT_PUBLIC_SANITY_DATASET',
  'SANITY_API_TOKEN',
  'SUPPORT_EMAIL_USER',
  'SUPPORT_EMAIL_PASS',
  'SUPPORT_EMAIL_RECEIVER',
  'SUPPORT_WHATSAPP_NUMBER',
  'NEXT_PUBLIC_SITE_URL',
  'REVALIDATE_SECRET_TOKEN',
];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2024-10-18',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const now = Date.now();
    const requests = rateLimitMap.get(ip) || [];
    const recentRequests = requests.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW);
    
    if (recentRequests.length >= MAX_REQUESTS) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    recentRequests.push(now);
    rateLimitMap.set(ip, recentRequests);

    const body = await req.json();
    const { name, email, phone, question, slug, subject } = body;

    // Validate required fields
    if (!name || !email || !phone || !question || !slug || !subject) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate phone format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Phone number must be 10 digits' },
        { status: 400 }
      );
    }

    // Fetch blog post
    const blog = await client.fetch(
      groq`*[_type == "post" && slug.current == $slug][0]{ _id, title }`,
      { slug }
    );

    if (!blog || !blog._id) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    // Create comment in Sanity
    const doc = {
      _type: 'comment',
      name,
      email,
      phone,
      question,
      subject,
      approved: false,
      submittedAt: new Date().toISOString(),
      blog: {
        _type: 'reference',
        _ref: blog._id,
      },
    };

    const result = await client.create(doc);

    // Email notification
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
Phone: +91${phone}
Question: ${question}
Subject: ${subject}
From Blog: https://www.pediahelp.com/blog/${slug}
      `.trim(),
    });

    // WhatsApp link
    const whatsappMessage = `Hi! I just asked a question on your blog (/blog/${slug}):\n\n"${question}"`;
    const whatsappLink = `https://wa.me/${process.env.SUPPORT_WHATSAPP_NUMBER?.replace('+', '')}?text=${encodeURIComponent(whatsappMessage)}`;

    // Revalidate blog page
    await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate?path=/blog/${slug}&secret=${process.env.REVALIDATE_SECRET_TOKEN}`
    ).catch((err) => console.warn('⚠️ Revalidation failed:', err.message));

    return NextResponse.json({ success: true, id: result._id, whatsappLink });
  } catch (error: any) {
    console.error('[Question] Submission failed:', error);
    return NextResponse.json(
      { error: 'Failed to submit question' },
      { status: 500 }
    );
  }
}