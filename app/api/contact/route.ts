import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { sendSupportEmail } from '@/lib/email'; // Your own email util

// Optional simple in-memory rate limiting (IP based)
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 5;
const rateLimits = new Map<string, { count: number; expiresAt: number }>();

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const current = rateLimits.get(ip) || { count: 0, expiresAt: Date.now() + RATE_LIMIT_WINDOW };

  if (Date.now() > current.expiresAt) {
    rateLimits.set(ip, { count: 0, expiresAt: Date.now() + RATE_LIMIT_WINDOW });
  } else if (current.count >= MAX_REQUESTS) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, email, phone, message, subject, userUid, idToken } = body;

  if (!name || !email || !phone || !message || !subject || !userUid || !idToken) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  try {
    // 🔹 1. Verify Firebase ID token
    const decoded = await getAuth().verifyIdToken(idToken);

    // 🔹 2. Ensure UID matches what client sent
    if (decoded.uid !== userUid) {
      return NextResponse.json({ error: 'User verification failed' }, { status: 403 });
    }

    // 🔹 3. (Optional but safer) Ensure phone matches verified number
    const normalize = (num: string) => num.replace(/^\+91/, '').replace(/^0+/, '');
    if (decoded.phone_number && normalize(decoded.phone_number) !== normalize(phone)) {
      return NextResponse.json({ error: 'Phone number mismatch' }, { status: 403 });
    }

    // 🔹 4. Save to Firestore
    const db = getFirestore();
    const docRef = await db.collection('contact-submissions').add({
      name,
      email,
      phone: `+91${normalize(phone)}`,
      message,
      subject,
      userUid,
      submittedAt: new Date(),
      ipAddress: ip,
      otpVerified: true,
    });

    // 🔹 5. Send email notification
    await sendSupportEmail({
      subject: `New Contact: ${subject}`,
      replyTo: email,
      html: `<p>${message}</p>`,
      text: message,
    });

    rateLimits.set(ip, { count: current.count + 1, expiresAt: current.expiresAt });

    return NextResponse.json({ message: 'Form submitted successfully', id: docRef.id });
  } catch (error) {
    console.error('❌ Contact submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
