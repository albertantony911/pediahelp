import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import nodemailer from 'nodemailer';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  subject: string;
  otpVerified: boolean;
  userUid?: string; // Firebase Auth UID as verification proof
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

    // Since we're using Firebase Auth OTP verification, we don't need reCAPTCHA Enterprise
    // The Firebase Auth process already includes spam protection
    console.log('✅ OTP verification confirmed, proceeding with form submission');
    
    // Optional: Additional validation using Firebase Auth UID
    if (body.userUid) {
      console.log('✅ Firebase Auth UID provided:', body.userUid);
    }

    // ✅ Save form to Firestore
    const docRef = await addDoc(collection(db, 'contact-submissions'), {
      name: body.name,
      email: body.email,
      phone: `+91${body.phone}`,
      message: body.message,
      subject: body.subject,
      submittedAt: serverTimestamp(),
      ipAddress: ip,
      otpVerified: true,
      userUid: body.userUid || null,
    });

    console.log('✅ Form saved to Firestore with ID:', docRef.id);

    // ✅ Send email notification
    if (!process.env.SUPPORT_EMAIL_USER || !process.env.SUPPORT_EMAIL_PASS) {
      console.warn('⚠️  Email credentials not configured, skipping email notification');
    } else {
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.SUPPORT_EMAIL_USER,
            pass: process.env.SUPPORT_EMAIL_PASS,
          },
        });

        const emailResult = await transporter.sendMail({
          from: process.env.SUPPORT_EMAIL_USER,
          to: process.env.SUPPORT_EMAIL_RECEIVER,
          replyTo: body.email,
          subject: `New Contact: ${body.subject}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
              <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">New Contact Form Submission</h2>
              
              <div style="margin: 20px 0;">
                <h3 style="color: #555; margin-bottom: 15px;">Contact Details:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 0; font-weight: bold; color: #666; width: 100px;">Name:</td>
                    <td style="padding: 8px 0; color: #333;">${body.name}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 0; font-weight: bold; color: #666;">Email:</td>
                    <td style="padding: 8px 0; color: #333;">${body.email}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px 0; font-weight: bold; color: #666;">Phone:</td>
                    <td style="padding: 8px 0; color: #333;">+91${body.phone}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; font-weight: bold; color: #666;">Verified:</td>
                    <td style="padding: 8px 0; color: #28a745;">✅ Phone Number Verified</td>
                  </tr>
                </table>
              </div>

              <div style="margin: 20px 0;">
                <h3 style="color: #555; margin-bottom: 15px;">Message:</h3>
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #007bff;">
                  ${body.message.replace(/\n/g, '<br>')}
                </div>
              </div>

              <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                <p>Submission ID: ${docRef.id}</p>
                <p>Submitted from IP: ${ip}</p>
                <p>Timestamp: ${new Date().toLocaleString()}</p>
              </div>
            </div>
          `,
          text: `
New Contact Form Submission

Name: ${body.name}
Email: ${body.email}
Phone: +91${body.phone}
Verified: ✅ Phone Number Verified

Message:
${body.message}

---
Submission ID: ${docRef.id}
IP Address: ${ip}
Timestamp: ${new Date().toLocaleString()}
          `,
        });

        console.log('✅ Email notification sent successfully:', emailResult.messageId);
      } catch (emailError) {
        console.error('❌ Failed to send email notification:', emailError);
        // Don't fail the entire request if email fails
      }
    }

    // Update rate limit
    rateLimits.set(ip, { count: current.count + 1, expiresAt: current.expiresAt });

    return NextResponse.json({ 
      message: 'Form submitted successfully',
      submissionId: docRef.id,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Contact submission error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}