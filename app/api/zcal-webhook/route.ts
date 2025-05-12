import { NextResponse } from 'next/server';
import { client as sanityClient } from '@/sanity/lib/client';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Basic validation
    if (!payload?.event || !payload?.invitee) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    const event = payload.event;
    const invitee = payload.invitee;
    const responses = invitee?.questions || [];

    // Extract custom answers
    const getAnswer = (label: string) =>
      responses.find((q: any) => q.label.toLowerCase() === label.toLowerCase())?.answer || '';

    const bookingToken = nanoid();

    const newBooking = {
      _id: `booking-${bookingToken}`,
      _type: 'booking',
      status: 'awaiting_verification',
      bookingToken,
      doctorSlug: payload.bookingLinkId || '',
      parentName: getAnswer('Parent Name'),
      patientName: getAnswer('Patient Name'),
      email: invitee.email || '',
      phone: getAnswer('Phone Number'),
      date: event.startTime.split('T')[0],
      time: new Date(event.startTime).toLocaleTimeString(),
      zcalEventId: event.id,
      createdAt: new Date().toISOString(),
    };

    await sanityClient.createIfNotExists(newBooking);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Zcal webhook error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}