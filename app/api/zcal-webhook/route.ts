import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  // Log the raw payload and signature for debugging
  console.log("Raw payload:", payload);
  console.log("Received signature:", signature);

  // Compute the expected signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  console.log("Expected signature:", expectedSignature);

  // Handle potential signature formats (e.g., "v1=signature")
  const signatureToCompare = signature.startsWith("v1=")
    ? signature.split("v1=")[1]
    : signature;

  return signatureToCompare === expectedSignature;
}

export async function POST(req: NextRequest) {
  try {
    // Get the raw body as text
    const rawBody = await req.text();

    // Log the secret for debugging (be careful with this in production)
    const webhookSecret = process.env.ZCAL_WEBHOOK_SECRET;
    console.log("Webhook secret:", webhookSecret);

    // Get the Zcal-Signature header
    const signature = req.headers.get("zcal-signature");
    if (!signature) {
      console.log("ZCal-Signature header missing");
      return NextResponse.json({ error: "Missing ZCal-Signature header" }, { status: 400 });
    }

    // Verify the signature
    if (!webhookSecret) {
      console.error("ZCAL_WEBHOOK_SECRET is not set");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
      console.log("Signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the payload
    const webhookData = JSON.parse(rawBody);

    // Log the event
    console.log("Received Zcal webhook:", webhookData);

    // Handle different event types
    switch (webhookData.type) {
      case "event.created":
        console.log("New event created:", webhookData.data);
        break;
      case "event.updated":
        console.log("Event updated:", webhookData.data);
        break;
      case "event.cancelled":
        console.log("Event cancelled:", webhookData.data);
        break;
      default:
        console.log("Unhandled event type:", webhookData.type);
    }

    // Acknowledge receipt
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}