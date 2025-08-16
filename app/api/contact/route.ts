import { NextRequest, NextResponse } from "next/server";
import { adminAuth, db } from "@/lib/firebaseAdmin";
import { sendSupportEmail } from "@/lib/email";
import { RateLimiterMemory } from "rate-limiter-flexible";

// Rate limiter: max 5 submissions per user (UID) per hour
const rateLimiter = new RateLimiterMemory({
  points: 50,
  duration: 3600, // 1 hour in seconds
});

// Simple spam check function
const isPotentialSpam = (message: string): boolean => {
  const spamKeywords = ['viagra', 'cialis', 'free money', 'win prize', 'click here', 'http://', 'https://'];
  const hasSpamKeywords = spamKeywords.some(keyword => message.toLowerCase().includes(keyword));
  const hasExcessiveCaps = message.toUpperCase().length / message.length > 0.7;
  const hasSuspiciousLength = message.length > 1000 || message.length < 10;

  return hasSpamKeywords || hasExcessiveCaps || hasSuspiciousLength;
};

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split("Bearer ")[1];
    if (!token) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch (err) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    // Apply rate limiting based on user UID
    try {
      await rateLimiter.consume(decoded.uid);
    } catch (rateLimiterError) {
      return NextResponse.json({ error: "Too many requests, please try again later" }, { status: 429 });
    }

    const { name, email, phone, message, subject, userUid } = await req.json();
    if (!name || !email || !phone || !message || !subject || !userUid) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Validate input data
    if (name.length > 50 || message.length > 500) {
      return NextResponse.json({ error: "Input exceeds maximum length" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (!/^[0-9]{10}$/.test(phone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    // Spam check
    if (isPotentialSpam(message)) {
      return NextResponse.json({ error: "Message flagged as potential spam" }, { status: 400 });
    }

    // Save to Firestore
    await db.collection("contact_submissions").add({
      name,
      email,
      phone,
      message,
      subject,
      userId: userUid,
      createdAt: new Date(),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      status: "pending",
    });

    // Send email notification with individual fields
    await sendSupportEmail({
      subject,
      message,
      name,
      email,
      phone,
      replyTo: email, // Set replyTo to the user's email
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}