import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { sendSupportEmail } from '@/lib/email';
import '@/lib/firebaseAdmin';

interface CareerFormData {
  name: string;
  email: string;
  phone: string;
  position: string;
  resumeUrl: string;
  coverLetter?: string;
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

  let body: CareerFormData;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    if (!body.name || !body.email || !body.phone || !body.position || !body.resumeUrl || !body.userUid) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const auth = getAuth();
    const user = await auth.getUser(body.userUid);
    if (!user.phoneNumber || !user.phoneNumber.endsWith(body.phone)) {
      return NextResponse.json({ error: 'Phone verification failed' }, { status: 400 });
    }

    const db = getFirestore();
    const docRef = await db.collection('career-applications').add({
      ...body,
      phone: `+91${body.phone}`,
      submittedAt: new Date(),
      ipAddress: ip,
      otpVerified: true,
    });

    console.log('✅ Career application saved:', docRef.id);

    await sendSupportEmail({
      subject: `New Career Application: ${body.position}`,
      message: `${body.name} applied for ${body.position}`,
      html: `<p>${body.name} applied for ${body.position}</p>
             <p>Email: ${body.email}</p>
             <p>Phone: ${body.phone}</p>
             <p>Resume: <a href="${body.resumeUrl}">${body.resumeUrl}</a></p>
             <p>Cover Letter: ${body.coverLetter || 'N/A'}</p>`,
      replyTo: body.email, // ✅ ensure HR replies to applicant
    });

    rateLimits.set(ip, { count: current.count + 1, expiresAt: current.expiresAt });
    return NextResponse.json({ message: 'Application submitted', id: docRef.id });
  } catch (error) {
    console.error('❌ Career submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
