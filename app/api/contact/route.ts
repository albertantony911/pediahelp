import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { sendSupportEmail } from "@/lib/email";

// ─── Rate limiting config ───
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 5;
const ipRequests = new Map<string, { count: number; lastRequest: number }>();

export async function POST(req: NextRequest) {
  try {
    // ─── Step 1: Rate limiting ───
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const now = Date.now();
    const record = ipRequests.get(ip);

    if (record && now - record.lastRequest < RATE_LIMIT_WINDOW) {
      if (record.count >= MAX_REQUESTS) {
        return NextResponse.json({ error: "Too many requests" }, { status: 429 });
      }
      record.count++;
    } else {
      ipRequests.set(ip, { count: 1, lastRequest: now });
    }

    // ─── Step 2: Verify Firebase ID token ───
    const idToken = req.headers.get("authorization")?.split("Bearer ")[1];
    if (!idToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await getAuth().verifyIdToken(idToken);

    // ─── Step 3: Parse form data ───
    const { name, email, phone, message, subject } = await req.json();
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ─── Step 4: Save to Firestore ───
    const db = getFirestore();
    await db.collection("contactMessages").add({
      uid: decoded.uid,
      name,
      email,
      phone,
      message,
      subject,
      createdAt: new Date(),
    });

    // ─── Step 5: Send support email ───
    await sendSupportEmail({
      name,
      email,
      phone,
      message,
      subject: subject || `New contact form submission`,
      replyTo: email, // ✅ ensure replies go to user
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in contact form API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
