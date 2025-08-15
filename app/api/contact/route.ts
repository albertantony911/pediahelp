import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { sendSupportEmail } from '@/lib/email';
import '@/lib/firebaseAdmin';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  subject: string;
  userUid: string;
}

const rateLimits = new Map<string, { count: number; expiresAt: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
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
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    if (!body.name || !body.email || !body.phone || !body.message || !body.subject || !body.userUid) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const auth = getAuth();
    const user = await auth.getUser(body.userUid);
    if (!user.phoneNumber || !user.phoneNumber.endsWith(body.phone)) {
      return NextResponse.json({ error: 'Phone verification failed' }, { status: 400 });
    }

    const db = getFirestore();
    const docRef = await db.collection('contact-submissions').add({
      ...body,
      phone: `+91${body.phone}`,
      submittedAt: new Date(),
      ipAddress: ip,
      otpVerified: true,
    });

    console.log('✅ Contact form saved:', docRef.id);

    await sendSupportEmail({
      subject: `New Contact: ${body.subject}`,
      replyTo: body.email,
      html: `<p>${body.message}</p>`,
      text: body.message,
    });

    rateLimits.set(ip, { count: current.count + 1, expiresAt: current.expiresAt });
    return NextResponse.json({ message: 'Form submitted', id: docRef.id });
  } catch (error) {
    console.error('❌ Contact submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
