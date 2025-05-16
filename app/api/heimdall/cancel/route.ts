// app/api/heimdall/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/sanity/lib/client';
import { triggerNotification } from '@/lib/heimdall-engine/notify/trigger';

export async function POST(req: NextRequest) {
  const { bookingId, cancelReason } = await req.json();

  if (!bookingId) {
    return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
  }

  const booking = await client.fetch(
    `*[_type == "booking" && _id == $bookingId][0]{
      _id,
      status,
      slot,
      patientName,
      childName,
      phone,
      email,
      doctor->{
        name,
        email,
        whatsappNumber
      }
    }`,
    { bookingId }
  );

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (booking.status === 'cancelled') {
    return NextResponse.json({ message: 'Booking already cancelled' });
  }

  await client.patch(bookingId)
    .set({ status: 'cancelled', cancelReason: cancelReason || '' })
    .commit();

  await triggerNotification(booking, 'cancellation');

  return NextResponse.json({ success: true, message: 'Booking cancelled and notification sent.' });
}