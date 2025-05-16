import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { notifyAll } from '@/lib/heimdall-engine/notify/trigger';

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const isTest = url.searchParams.get('test') === 'true';

  const { bookingId } = await req.json();

  if (!bookingId) {
    return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
  }

  const booking = await client.fetch(
    `*[_type == "booking" && _id == $bookingId][0]{
      _id,
      patientName,
      childName,
      phone,
      email,
      slot,
      doctor->{
        name,
        email,
        whatsappNumber
      },
      status
    }`,
    { bookingId }
  );

  if (!booking || booking.status !== 'paid') {
    return NextResponse.json({ error: 'Booking not found or not marked as paid' }, { status: 404 });
  }

  if (isTest) {
    console.log('🧪 Test mode active — skipping real notifications');
    return NextResponse.json({
      message: 'Test mode: notification would be sent here.',
      bookingId: booking._id,
      patient: booking.patientName,
      doctor: booking.doctor.name,
    });
  }

  const notifyResult = await notifyAll(booking, {
    email: true,
    sms: true,
    whatsapp: true,
  });

  console.log('📣 Notification Results:', notifyResult);

  return NextResponse.json({ success: true, notifyResult });
}