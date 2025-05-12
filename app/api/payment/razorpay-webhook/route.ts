import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { client as sanityClient } from '@/sanity/lib/client';

export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const body = await req.text(); // must read raw body to verify signature
  const razorpaySignature = req.headers.get('x-razorpay-signature') || '';

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (razorpaySignature !== expectedSignature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);

  if (event.event === 'payment.captured') {
    const payment = event.payload.payment.entity;
    const { order_id, id: paymentId, notes } = payment;

    const bookingToken = notes?.bookingToken;

    if (!bookingToken) {
      return NextResponse.json({ error: 'Missing booking token' }, { status: 400 });
    }

    // ✅ Update booking in Sanity
    await sanityClient
      .patch(`booking-${bookingToken}`)
      .set({
        status: 'confirmed',
        paymentId,
        paidAt: new Date().toISOString(),
        updatedViaWebhook: true,
      })
      .commit({ autoGenerateArrayKeys: true });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ received: true });
}