import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  subject: string;
  otpVerified: boolean;
  recaptchaToken?: string;
  recaptchaAction?: string;
}

const rateLimits = new Map<string, { count: number; expiresAt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5;

setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of rateLimits) {
    if (limit.expiresAt < now) rateLimits.delete(ip);
  }
}, RATE_LIMIT_WINDOW);

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const current = rateLimits.get(ip) || { count: 0, expiresAt: Date.now() + RATE_LIMIT_WINDOW };
  if (current.count >= MAX_REQUESTS) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: ContactFormData;
  try {
    body = await req.json();
  } catch (error) {
    console.error('Invalid JSON payload:', error);
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  try {
    // Basic validations
    if (!body.name || !body.email || !body.phone || !body.message || !body.subject) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    if (body.otpVerified !== true) {
      return NextResponse.json({ error: 'OTP verification required' }, { status: 400 });
    }

    if (!body.recaptchaToken || !body.recaptchaAction) {
      return NextResponse.json({ error: 'Missing reCAPTCHA token or action' }, { status: 400 });
    }

    // ✅ reCAPTCHA Enterprise verification
    const recaptchaClient = new RecaptchaEnterpriseServiceClient();
    const [assessment] = await recaptchaClient.createAssessment({
      parent: `projects/pediahelp-authentication`,
      assessment: {
        event: {
          token: body.recaptchaToken,
          siteKey: "6Lc3hk4rAAAAAJaeAMZIPpXK_eAVu9vJjLddB0TU", // hardcoded v2 invisible key
          expectedAction: body.recaptchaAction,
          userIpAddress: ip,
          userAgent: req.headers.get('user-agent') || '',
        },
      },
    });

    if (!assessment.tokenProperties?.valid) {
      return NextResponse.json({ error: 'Invalid reCAPTCHA token' }, { status: 400 });
    }

    const score = assessment.riskAnalysis?.score ?? 0;
    if (score < 0.5) {
      return NextResponse.json({ error: 'Low reCAPTCHA score', score }, { status: 403 });
    }

    console.log(`✅ reCAPTCHA token verified. Score: ${score}`);

    // ✅ Save form to Firestore
    await addDoc(collection(db, 'contact-submissions'), {
      name: body.name,
      email: body.email,
      phone: `+91${body.phone}`,
      message: body.message,
      subject: body.subject,
      submittedAt: serverTimestamp(),
      ipAddress: ip,
      otpVerified: true,
    });

    // ✅ Send email
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SUPPORT_EMAIL_USER,
        pass: process.env.SUPPORT_EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SUPPORT_EMAIL_USER,
      to: process.env.SUPPORT_EMAIL_RECEIVER,
      replyTo: body.email,
      subject: `New Contact: ${body.subject}`,
      text: `Name: ${body.name}\nEmail: ${body.email}\nPhone: +91${body.phone}\n\nMessage:\n${body.message}`,
    });

    rateLimits.set(ip, { count: current.count + 1, expiresAt: current.expiresAt });

    return NextResponse.json({ message: 'Form submitted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Contact submission error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
