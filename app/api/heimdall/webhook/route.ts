import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { client } from '@/sanity/lib/client';

export async function POST(req: NextRequest) {
    console.log('🔥 Webhook hit');
  const signature = req.headers.get('x-razorpay-signature');
  const body = await req.text(); // Read raw body first

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
      await client
        .patch(bookingId)
        .set({ status: 'paid', paymentId: payment.id })
        .commit();

      console.log(`[Webhook] Booking ${bookingId} marked as paid ✅`);
    } catch (err) {
      console.error('[Webhook] Failed to update booking:', err);
    }
  }

  return new Response('OK', { status: 200 });
}