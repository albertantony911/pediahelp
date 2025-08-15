import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { sendSupportEmail } from '@/lib/email';
import fetch from 'node-fetch';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 5;
const rateLimits = new Map<string, { count: number; expiresAt: number }>();

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const current = rateLimits.get(ip) || { count: 0, expiresAt: Date.now() + RATE_LIMIT_WINDOW };

  if (Date.now() > current.expiresAt) {
    rateLimits.set(ip, { count: 0, expiresAt: Date.now() + RATE_LIMIT_WINDOW });
  } else if (current.count >= MAX_REQUESTS) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Extract tokens
  const idToken = req.headers.get('authorization')?.replace('Bearer ', '');
  const recaptchaToken = req.headers.get('x-recaptcha-token');

  if (!idToken || !recaptchaToken) {
    return NextResponse.json({ error: 'Missing verification tokens' }, { status: 400 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, email, phone, message, subject, userUid } = body;

  if (!name || !email || !phone || !message || !subject || !userUid) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  try {
    // Step 1: Verify Firebase ID token
    const decoded = await getAuth().verifyIdToken(idToken);
    if (decoded.uid !== userUid) {
      return NextResponse.json({ error: 'User verification failed' }, { status: 403 });
    }

    // Step 2: Verify reCAPTCHA v2 invisible
    const recaptchaRes = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`,
    });
    const recaptchaData = await recaptchaRes.json() as { success: boolean; [key: string]: any };
    if (!recaptchaData.success) {
      return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 403 });
    }

    // Step 3: Save to Firestore
    const db = getFirestore();
    const docRef = await db.collection('contact-submissions').add({
      name,
      email,
      phone,
      message,
      subject,
      userUid,
      submittedAt: new Date(),
      ipAddress: ip,
      recaptchaVerified: true,
    });

    // Step 4: Send email notification
    await sendSupportEmail({
      subject: `New Contact: ${subject}`,
      replyTo: email,
      html: `<p>${message}</p>`,
      text: message,
    });

    // Update rate limit
    rateLimits.set(ip, { count: current.count + 1, expiresAt: current.expiresAt });

    return NextResponse.json({ message: 'Form submitted successfully', id: docRef.id });
  } catch (error) {
    console.error('❌ Contact submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}