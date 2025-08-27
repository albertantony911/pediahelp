// app/api/heimdall/webhook/route.ts
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { client } from '@/sanity/lib/client';
import { notifyAll } from '@/lib/heimdall-engine/notify/trigger';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-razorpay-signature');
  const body = await req.text();

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (signature !== expected) {
    console.error('[Webhook] Invalid signature');
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const bookingId = payment.receipt;

    try {
      await client.patch(bookingId).set({ status: 'paid', paymentId: payment.id }).commit();
      console.log(`[Webhook] Booking ${bookingId} marked as paid ✅`);

      // Fetch booking with joined doctor for notifications
      const booking = await client.fetch(
        `*[_type == "booking" && _id == $bookingId][0]{
          _id, patientName, childName, phone, email, slot,
          doctor->{
            name, email, whatsappNumber
          },
          status
        }`,
        { bookingId }
      );

      if (booking?.status === 'paid') {
        await notifyAll(booking, { email: true, sms: true, whatsapp: true });
      }
    } catch (err) {
      console.error('[Webhook] Failed to update/notify booking:', err);
    }
  }

  return new Response('OK', { status: 200 });
}