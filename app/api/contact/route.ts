import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import * as admin from "firebase-admin";

// ----------------------
// Firebase Admin Init
// ----------------------
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

// ----------------------
// Email Transporter
// ----------------------
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

// ----------------------
// Validators
// ----------------------
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const isValidPhone = (phone: string) =>
  /^[0-9]{10}$/.test(phone);

export async function POST(req: Request) {
  try {
    const { name, email, phone, userUid } = await req.json();

    // Check required fields
    if (!name || !email || !phone || !userUid) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Validate email + phone
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!isValidPhone(phone)) {
      return NextResponse.json({ error: "Invalid phone" }, { status: 400 });
    }

    // ----------------------
    // Server-side OTP verification
    // ----------------------
    const userRecord = await admin.auth().getUser(userUid);
    if (!userRecord.phoneNumber) {
      return NextResponse.json(
        { error: "No phone number linked to UID" },
        { status: 403 }
      );
    }

    // Ensure last 10 digits match exactly
    const serverPhone = userRecord.phoneNumber.replace("+91", "");
    if (serverPhone !== phone) {
      return NextResponse.json(
        { error: "OTP verification failed" },
        { status: 403 }
      );
    }

    // ----------------------
    // Send email
    // ----------------------
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.CONTACT_FORM_RECEIVER,
      subject: "New Contact Form Submission",
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
