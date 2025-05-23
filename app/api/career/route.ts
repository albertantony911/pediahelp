import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 10;

// Validate environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_SITE_URL',
  'REVALIDATE_SECRET_TOKEN',
];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
}

interface CareerFormData {
  name: string;
  email: string;
  phone: string;
  jobTitle: string;
  coverLetter: string;
  resumeLink: string;
  subject: string;
}

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

    const body: CareerFormData = await req.json();

    // Validate required fields
    if (!body.name || !body.email || !body.phone || !body.jobTitle || !body.coverLetter || !body.resumeLink || !body.subject) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Validate phone format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(body.phone)) {
      return NextResponse.json(
        { error: 'Phone number must be 10 digits' },
        { status: 400 }
      );
    }

    // Validate resume link (Google Drive shareable URL)
    const driveRegex = /https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+\/view\?usp=sharing/;
    if (!driveRegex.test(body.resumeLink)) {
      return NextResponse.json(
        { error: 'Invalid Google Drive shareable link' },
        { status: 400 }
      );
    }


    try {
      const response = await fetch(body.resumeLink, { method: 'HEAD' });
      if (response.status !== 200 || response.url.includes('accounts.google.com')) {
        return NextResponse.json(
          { error: 'Resume link is not publicly accessible. Set sharing to "Anyone with the link".' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to verify resume link accessibility' },
        { status: 400 }
      );
    }


    // Store in Firestore
    const submission = {
      name: body.name,
      email: body.email,
      phone: `+91${body.phone}`,
      jobTitle: body.jobTitle,
      coverLetter: body.coverLetter,
      resumeLink: body.resumeLink,
      subject: body.subject,
      submittedAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'career-submissions'), submission);

    // Revalidate careers page
    await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate?path=/careers&secret=${process.env.REVALIDATE_SECRET_TOKEN}`
    ).catch((err) => console.warn('⚠️ Revalidation failed:', err.message));

    return NextResponse.json(
      { message: 'Application submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}