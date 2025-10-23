// app/api/heimdall/notify/route.ts
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

  // ⬇️ also fetch meeting.inviteId we stored in /meet/create (or in pay/verify)
  const booking = await client.fetch(
    `*[_type == "booking" && _id == $bookingId][0]{
      _id,
      patientName,
      childName,
      phone,
      email,
      slot,
      status,
      meeting{ inviteId },
      doctor->{ name, email, whatsappNumber }
    }`,
    { bookingId }
  );

  if (!booking || booking.status !== 'paid') {
    return NextResponse.json({ error: 'Booking not found or not marked as paid' }, { status: 404 });
  }

  const BASE = process.env.NEXT_PUBLIC_BASE_URL || 'https://yourdomain.com';
  const inviteId: string | undefined = booking?.meeting?.inviteId;

  const links = inviteId
    ? {
        patientJoinUrl: `${BASE}/heimdall/meet/i/${inviteId}?who=patient`,
        doctorJoinUrl:  `${BASE}/heimdall/meet/i/${inviteId}?who=doctor`,
      }
    : undefined;

  if (isTest) {
    return NextResponse.json({
      message: 'Test mode: would notify with links below.',
      links,
      bookingId: booking._id,
      patient: booking.patientName,
      doctor: booking.doctor?.name,
    });
  }

  const notifyResult = await notifyAll(booking, { email: true, sms: true, whatsapp: true }, links);
  return NextResponse.json({ success: true, notifyResult, links });
}