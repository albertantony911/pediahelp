// app/api/zcal-webhook/route.ts

import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { client as sanityClient } from '@/sanity/lib/client';
import { nanoid } from 'nanoid';

export const runtime = 'nodejs';  // ensure Node APIs are available

export async function POST(req: Request) {
  const secret = process.env.ZCAL_WEBHOOK_SECRET!;
  const signature = req.headers.get('x-zcal-signature') || '';
  const rawBody = await req.text();

  // 1) verify signature (hex-encoded)
  const expectedSig = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  // timingSafeEqual wants Buffers of equal length
  const sigBuf = Buffer.from(signature, 'hex');
  const expectedBuf = Buffer.from(expectedSig, 'hex');
  if (
    sigBuf.length !== expectedBuf.length ||
    !timingSafeEqual(sigBuf, expectedBuf)
  ) {
    console.error('[❌] Invalid signature:', signature, expectedSig);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // 2) parse JSON
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    console.error('[❌] JSON parse error', err);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 3) destructure the real Zcal envelope
  const { data } = payload;  
  const event = data?.event;
  const invitee = data?.invitee;
  const bookingLink = data?.bookingLink;

  if (!event || !invitee || !bookingLink?.id) {
    console.error('[❌] Missing event/invitee/bookingLink in payload', payload);
    return NextResponse.json({ error: 'Malformed payload' }, { status: 400 });
  }

  // helper to pull answers
  const responses: any[] = invitee.questions || [];
  const getAnswer = (label: string) =>
    responses.find(q => q.label.toLowerCase() === label.toLowerCase())?.answer || '';

  // map Zcal link → doctor
  const linkId = bookingLink.id;
  const doctor = await sanityClient.fetch(
    `*[_type=="doctor" && zcalBookingLinkId == $linkId][0]{ slug }`,
    { linkId }
  );

  if (!doctor?.slug) {
    console.error('[❌] No doctor with linkId', linkId);
    return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
  }

  // build booking doc
  const idToken = nanoid();
  const start = new Date(event.startTime);
  const newBooking = {
    _id: `booking-${idToken}`,
    _type: 'booking',
    status: 'pending',
    bookingToken: idToken,
    doctorSlug: doctor.slug,
    parentName: getAnswer('Parent Name'),
    patientName: getAnswer('Patient Name'),
    email: invitee.email,
    phone: getAnswer('Phone Number'),
    date: start.toISOString().split('T')[0],
    time: start.toLocaleTimeString('en-US', { hour12: false }),
    zcalEventId: event.id,
    createdAt: new Date().toISOString(),
  };

  // 4) save to Sanity
  try {
    await sanityClient.createIfNotExists(newBooking);
    console.log('[✅] Booking saved', newBooking);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[❌] Sanity write error', err);
    return NextResponse.json({ error: 'DB write failed' }, { status: 500 });
  }
}
