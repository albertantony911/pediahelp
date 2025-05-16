import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { client } from '@/sanity/lib/client';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  const { bookingId } = await req.json();

  if (!bookingId) {
    return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
  }

  // Fetch booking and linked doctor
  const booking = await client.fetch(
    `*[_type == "booking" && _id == $bookingId][0]{
      _id,
      slot,
      status,
      doctor->{
        _id,
        name,
        appointmentFee
      }
    }`,
    { bookingId }
  );

  if (!booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }

  if (booking.status !== 'pending') {
    return NextResponse.json({ error: 'Booking already paid or cancelled' }, { status: 409 });
  }

  const amountInPaise = booking.doctor.appointmentFee * 100;

  // Create Razorpay Order
  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: bookingId,
    payment_capture: true, // Fix 1: Changed from 1 to true
  });

  // Explicitly type order to help TypeScript
  const typedOrder = order as { id: string; amount: number; currency: string; receipt: string; status: string };

  return NextResponse.json({
    orderId: typedOrder.id, // Fix 2: Use typedOrder
    amount: amountInPaise,
    currency: 'INR',
    bookingId,
    doctor: {
      name: booking.doctor.name,
    },
    slot: booking.slot,
    keyId: process.env.RAZORPAY_KEY_ID, // frontend will use this
  });
}