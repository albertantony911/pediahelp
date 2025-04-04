import { NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!, // Add your Razorpay Key ID in .env
  key_secret: process.env.RAZORPAY_KEY_SECRET!, // Add your Razorpay Key Secret in .env
});

export async function POST(request: Request) {
  try {
    const { amount, bookingId } = await request.json(); // Amount in paise, bookingId to track the booking

    const order = await razorpay.orders.create({
      amount: amount, // e.g., 50000 for ₹500 (amount in paise)
      currency: "INR",
      receipt: `booking_${bookingId}`,
      notes: { bookingId },
    });

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}