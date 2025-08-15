import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { sendSupportEmail } from "@/lib/email";
import { RecaptchaEnterpriseServiceClient } from "@google-cloud/recaptcha-enterprise";

// ─── Rate limiting config ───
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS = 50;
const rateLimits = new Map<string, { count: number; expiresAt: number }>();

// ─── Google reCAPTCHA Enterprise Client ───
let client: RecaptchaEnterpriseServiceClient;
if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  client = new RecaptchaEnterpriseServiceClient({ credentials });
} else {
  throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON is not set. Please configure it in your environment variables.");
}

const projectPath = client.projectPath(process.env.GOOGLE_CLOUD_PROJECT_ID!);

// ─── Verify reCAPTCHA Enterprise token ───
async function verifyRecaptchaEnterprise(token: string, expectedAction: string) {
  const request = {
    assessment: {
      event: {
        token,
        siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!,
      },
    },
    parent: projectPath,
  };

  const [response] = await client.createAssessment(request);

  if (!response.tokenProperties?.valid) {
    throw new Error("Invalid reCAPTCHA token");
  }

  if (response.tokenProperties.action !== expectedAction) {
    throw new Error(`Unexpected reCAPTCHA action: ${response.tokenProperties.action}`);
  }

  const score = response.riskAnalysis?.score ?? 0;
  if (score < 0.5) {
    throw new Error("Suspicious activity detected");
  }

  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const now = Date.now();
  let current = rateLimits.get(ip) || { count: 0, expiresAt: now + RATE_LIMIT_WINDOW };

  if (now > current.expiresAt) {
    current = { count: 0, expiresAt: now + RATE_LIMIT_WINDOW };
    rateLimits.set(ip, current);
  } else if (current.count >= MAX_REQUESTS) {
    return NextResponse.json({ error: "Too many requests, please try later" }, { status: 429 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, email, phone, message, subject, userUid } = body;  // Tokens not in body

  const idToken = req.headers.get('authorization')?.replace('Bearer ', '');
  const recaptchaToken = req.headers.get('x-recaptcha-token');

  if (!name || !email || !phone || !message || !subject || !userUid || !recaptchaToken || !idToken) {
    return NextResponse.json({ error: "All fields and tokens are required" }, { status: 400 });
  }

  try {
    // 🔹 Verify Firebase Auth token
    const decoded = await getAuth().verifyIdToken(idToken);
    if (decoded.uid !== userUid) {
      return NextResponse.json({ error: "User verification failed" }, { status: 403 });
    }

    // 🔹 Verify reCAPTCHA Enterprise
    await verifyRecaptchaEnterprise(recaptchaToken, "CONTACT_FORM");  // Match case to client

    // 🔹 Save to Firestore
    const db = getFirestore();
    const docRef = await db.collection("contact-submissions").add({
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

    // 🔹 Send email
    await sendSupportEmail({
      subject: `New Contact: ${subject}`,
      replyTo: email,
      html: `<p>${message}</p>`,
      text: message,
    });

    // 🔹 Update rate limit count
    current.count += 1;
    rateLimits.set(ip, current);

    return NextResponse.json({ message: "Form submitted successfully", id: docRef.id });
  } catch (error) {
    console.error("❌ Contact submission error:", error);
    return NextResponse.json(
      { error: "We couldn't process your request. Please try again later." },
      { status: 500 }
    );
  }
}