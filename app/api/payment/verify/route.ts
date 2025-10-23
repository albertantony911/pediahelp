// app/api/payment/verify/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { client } from '@/sanity/lib/client';

export async function POST(request: Request) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, bookingId } =
      await request.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !bookingId) {
      return NextResponse.json(
        { success: false, error: 'Missing parameters' },
        { status: 400 }
      );
    }

    // ✅ Verify Razorpay signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    // ✅ Mark booking as paid in Sanity
    await client.patch(bookingId)
      .set({
        status: 'paid',
        razorpayPaymentId: razorpay_payment_id,
        paidAt: new Date().toISOString(),
      })
      .commit();

    // ✅ Create meeting
    const meetRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/heimdall/meet/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    });
    const meetJson = await meetRes.json();
    const inviteId = meetJson?.inviteId || null;

    if (inviteId) {
      await client.patch(bookingId).set({ meeting: { inviteId } }).commit();
    }

    // ✅ Trigger notifications
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/heimdall/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    });

    return NextResponse.json({ success: true, inviteId });
  } catch (err) {
    console.error('[payment/verify] error:', err);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}