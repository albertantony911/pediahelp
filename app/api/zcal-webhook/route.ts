import { NextResponse } from 'next/server';
import { client as sanityClient } from '@/sanity/lib/client';
import crypto from 'crypto';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  const secret = process.env.ZCAL_WEBHOOK_SECRET!;
  const signature = req.headers.get('x-zcal-signature') || '';
  const rawBody = await req.text();

  // Step 1: Verify HMAC Signature
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('[❌ Invalid Zcal Signature]', { signature, expectedSignature });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Step 2: Safely parse raw body
  let payload;
  try {
    payload = JSON.parse(rawBody);
    console.log('[Zcal Webhook Payload]', payload); // Debug log
  } catch (err) {
    console.error('[❌ Invalid JSON]', err);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Step 3: Validate essential data
  if (!payload?.event || !payload?.invitee) {
    console.error('[❌ Invalid Webhook Payload]', payload);
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }

  const event = payload.event;
  const invitee = payload.invitee;
  const responses = invitee?.questions || [];

  const getAnswer = (label: string) =>
    responses.find((q: any) => q.label.toLowerCase() === label.toLowerCase())?.answer || '';

  const bookingToken = nanoid();

  // Step 4: Map Zcal bookingLinkId to doctorSlug
  const zcalBookingLinkId = payload.bookingLinkId || '';
  const doctor = await sanityClient.fetch(
    `*[_type == "doctor" && zcalBookingLinkId == $zcalBookingLinkId][0]{ "slug": slug.current }`,
    { zcalBookingLinkId }
  );
  const doctorSlug = doctor?.slug || '';
  if (!doctorSlug) {
    console.error('[❌ Doctor not found for zcalBookingLinkId]', zcalBookingLinkId);
    return NextResponse.json({ error: 'Doctor not found' }, { status: 400 });
  }

  const newBooking = {
    _id: `booking-${bookingToken}`,
    _type: 'booking',
    status: 'awaiting_verification',
    bookingToken,
    doctorSlug,
    parentName: getAnswer('Parent Name'),
    patientName: getAnswer('Patient Name'),
    email: invitee.email || '',
    phone: getAnswer('Phone Number'),
    date: event.startTime.split('T')[0],
    time: new Date(event.startTime).toLocaleTimeString(),
    zcalEventId: event.id,
    createdAt: new Date().toISOString(),
  };

  try {
    await sanityClient.createIfNotExists(newBooking);
    console.log('[✅ Booking Saved]', newBooking);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[❌ Failed to save booking]', err);
    return NextResponse.json({ error: 'Sanity write error' }, { status: 500 });
  }
}