import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Enhanced rate limiter
const rateLimits = new Map<string, { count: number; expiresAt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5;

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  subject: string;
  otpVerified: boolean;
}

// Cleanup expired rate limits
setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of rateLimits.entries()) {
    if (limit.expiresAt < now) {
      rateLimits.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';

  // Rate limiting check
  const currentLimit = rateLimits.get(ip) || { count: 0, expiresAt: Date.now() + RATE_LIMIT_WINDOW };
  if (currentLimit.count >= MAX_REQUESTS) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': RATE_LIMIT_WINDOW.toString() } }
    );
  }

  try {
    const body: ContactFormData = await req.json();

    // Validation
    if (!body.name || !body.email || !body.phone || !body.message || !body.subject) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (body.otpVerified !== true) {
      return NextResponse.json(
        { error: 'OTP verification required' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    if (!/^[0-9]{10}$/.test(body.phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Must be 10 digits.' },
        { status: 400 }
      );
    }

    // Store submission
    await addDoc(collection(db, 'contact-submissions'), {
      name: body.name,
      email: body.email,
      phone: `+91${body.phone}`, // Ensure phone is stored with country code
      message: body.message,
      subject: body.subject,
      submittedAt: serverTimestamp(),
      ipAddress: ip,
      otpVerified: body.otpVerified,
    });

    // Update rate limit
    rateLimits.set(ip, {
      count: currentLimit.count + 1,
      expiresAt: currentLimit.expiresAt,
    });

    return NextResponse.json(
      { message: 'Form submitted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}