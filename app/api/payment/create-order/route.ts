import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { bookingToken, name, email, phone, amount } = body;

    if (!bookingToken || !name || !email || !phone || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const options = {
      amount: amount, // amount in paise (₹1500 = 150000)
      currency: 'INR',
      receipt: `receipt_${bookingToken}`,
      notes: {
        bookingToken,
        name,
        email,
        phone,
      },
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      orderId: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  } catch (err: any) {
    console.error('Error creating Razorpay order:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}