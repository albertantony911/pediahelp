import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@sanity/client";

function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  console.log("Raw payload for signature:", Buffer.from(payload).toString("hex"));
  console.log("Received signature:", signature);

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  console.log("Expected signature (raw):", expectedSignature);

  const trimmedPayload = payload.trim();
  const expectedSignatureTrimmed = crypto
    .createHmac("sha256", secret)
    .update(trimmedPayload)
    .digest("hex");
  console.log("Expected signature (trimmed):", expectedSignatureTrimmed);

  const signatureToCompare = signature.startsWith("v1=")
    ? signature.split("v1=")[1]
    : signature;

  return (
    signatureToCompare === expectedSignature ||
    signatureToCompare === expectedSignatureTrimmed
  );
}

// Initialize Sanity client
const sanityClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  apiVersion: "2025-05-13",
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN,
});

export async function POST(req: NextRequest) {
  try {
    // Get the raw body as text
    const rawBody = await req.text();

    // Log the secret for debugging (remove in production)
    const webhookSecret = process.env.ZCAL_WEBHOOK_SECRET;
    console.log("Webhook secret:", webhookSecret);

    // Get the Zcal-Signature header
    const signature = req.headers.get("zcal-signature");
    if (signature) {
      if (!webhookSecret) {
        console.error("ZCAL_WEBHOOK_SECRET is not set");
        return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
      }

      if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        console.log("Signature verification failed");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } else {
      console.log("ZCal-Signature header missing, proceeding without verification");
    }

    // Parse the payload
    const webhookData = JSON.parse(rawBody);

    // Log the event
    console.log("Received Zcal webhook:", webhookData);

    // Handle different event types
    switch (webhookData.type) {
      case "event.created":
        console.log("New event created:", webhookData.data);
        // Map Zcal payload to Sanity booking schema
        const eventData = webhookData.data;
        const attendee = eventData.attendees.find((a: any) => a.type === "invitee") || eventData.attendees[0];
        const host = eventData.hosts[0];

        // Extract date and time from startDate
        const startDate = new Date(eventData.startDate);
        const date = startDate.toISOString().split("T")[0]; // e.g., "2025-05-14"
        const time = startDate.toTimeString().split(" ")[0]; // e.g., "09:52:57"

        // Create booking document in Sanity
        const booking = {
          _type: "booking",
          bookingToken: crypto.randomUUID(),
          status: "awaiting_verification",
          doctorSlug: host?.email.split("@")[0] || "unknown-doctor",
          parentName: attendee?.name || "Unknown Parent",
          patientName: "", // Not provided; can be updated later
          email: attendee?.email || "",
          phone: attendee?.phoneNumber || "",
          date: date,
          time: time,
          zcalEventId: eventData.id,
          createdAt: new Date().toISOString(),
        };

        // Log the booking object for debugging
        console.log("Attempting to create booking in Sanity:", booking);

        const result = await sanityClient.create(booking);
        console.log("Booking saved to Sanity:", result._id);
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