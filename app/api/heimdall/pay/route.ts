// app/api/heimdall/pay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { client } from '@/sanity/lib/client';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });

    const booking = await client.fetch(
      `*[_type == "booking" && _id == $bookingId][0]{
        _id, slot, status,
        doctor->{
          _id, name, appointmentFee
        }
      }`,
      { bookingId }
    );

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.status !== 'verified') {
      return NextResponse.json({ error: 'Booking not verified' }, { status: 409 });
    }

    const amountInPaise = (booking.doctor?.appointmentFee || 0) * 100;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: bookingId,
      payment_capture: true,
    });

    const typedOrder = order as { id: string; amount: number; currency: string; receipt: string; status: string };

    // Optionally persist order id on booking
    await client.patch(bookingId).set({ razorpayOrderId: typedOrder.id }).commit().catch(() => {});

    return NextResponse.json({
      orderId: typedOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      bookingId,
      doctor: { name: booking.doctor?.name || 'Doctor' },
      slot: booking.slot,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (e: any) {
    console.error('[heimdall/pay] error:', e?.message || e);
    return NextResponse.json({ error: 'pay_failed' }, { status: 500 });
  }
}