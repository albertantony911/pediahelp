import { NextRequest, NextResponse } from "next/server";
import { adminAuth, db } from "@/lib/firebaseAdmin";
import { sendSupportEmail } from "@/lib/email";
import { RateLimiterMemory } from "rate-limiter-flexible";

// ─── Rate limiter: 5 submissions per UID per hour ───
const rateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 3600, // 1 hour in seconds
});

// ─── Simple spam check ───
const isPotentialSpam = (message: string): boolean => {
  const spamKeywords = ["viagra", "cialis", "free money", "win prize", "click here", "http://", "https://"];
  const hasSpamKeywords = spamKeywords.some((keyword) =>
    message.toLowerCase().includes(keyword)
  );

  const uppercaseCount = (message.match(/[A-Z]/g) || []).length;
  const hasExcessiveCaps = uppercaseCount / message.length > 0.7;

  const hasSuspiciousLength = message.length > 1000 || message.length < 10;

  return hasSpamKeywords || hasExcessiveCaps || hasSuspiciousLength;
};

export async function POST(req: NextRequest) {
  try {
    // ─── Step 1: Verify Firebase ID token ───
    const token = req.headers.get("authorization")?.split("Bearer ")[1];
    if (!token) {
      return NextResponse.json({ error: "Missing auth token" }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const userId = decoded.uid;

    // ─── Step 2: Apply rate limiting (UID-based) ───
    try {
      await rateLimiter.consume(userId);
    } catch {
      return NextResponse.json(
        { error: "Too many requests, please try again later" },
        { status: 429 }
      );
    }

    // ─── Step 3: Parse body ───
    const { name, email, phone, message, subject } = await req.json();

    if (!name || !email || !phone || !message || !subject) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // ─── Step 4: Validate fields ───
    if (name.length > 50 || message.length > 500) {
      return NextResponse.json({ error: "Input exceeds maximum length" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Allow E.164 format numbers (+1234567890)
    if (!/^\+?[1-9]\d{6,14}$/.test(phone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    // Spam check
    if (isPotentialSpam(message)) {
      return NextResponse.json({ error: "Message flagged as potential spam" }, { status: 400 });
    }

    // ─── Step 5: Save to Firestore ───
    await db.collection("contact_submissions").add({
      userId,
      name,
      email,
      phone,
      message,
      subject,
      createdAt: new Date(),
      ipAddress: req.headers.get("x-forwarded-for") || "unknown",
      status: "pending",
    });

    // ─── Step 6: Send email notification ───
    await sendSupportEmail({
      subject,
      message,
      name,
      email,
      phone,
      replyTo: email,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
