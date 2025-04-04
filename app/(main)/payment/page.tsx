"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const bookingId = searchParams.get("bookingId"); // Get bookingId from URL
  const amount = searchParams.get("amount"); // Get amount from URL (in INR)

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);

    // Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert("Failed to load Razorpay SDK. Please try again.");
      setLoading(false);
      return;
    }

    // Create Razorpay order by calling your API
    const response = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseInt(amount!) * 100, bookingId }), // Convert INR to paise
    });

    const { orderId } = await response.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Add Key ID in .env
      amount: parseInt(amount!) * 100, // Amount in paise
      currency: "INR",
      name: "Your Company Name",
      description: `Payment for Booking #${bookingId}`,
      order_id: orderId,
      handler: async (response: any) => {
        // On successful payment, verify the payment on the server
        const verifyResponse = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            bookingId,
          }),
        });

        const result = await verifyResponse.json();
        if (result.success) {
          // Payment verified, confirm booking in Zcal
          await confirmBooking(bookingId!);
          router.push(`/payment/confirmation?bookingId=${bookingId}`);
        } else {
          // Payment failed, redirect to failure page with retry link
          router.push(`/payment/failed?bookingId=${bookingId}`);
        }
      },
      prefill: {
        name: "Customer Name", // You can fetch this dynamically
        email: "customer@example.com",
        contact: "9999999999",
      },
      theme: { color: "#3399cc" },
    };

    const paymentObject = new (window as any).Razorpay(options);
    paymentObject.open();
    setLoading(false);
  };

  const confirmBooking = async (bookingId: string) => {
    // Call Zcal API to confirm the booking
    // Example: Update booking status in your database or via Zcal API
    console.log(`Confirming booking ${bookingId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Complete Your Payment</h1>
      <p className="mb-4">Booking ID: {bookingId}</p>
      <p className="mb-4">Amount: ₹{amount}</p>
      <button
        onClick={handlePayment}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay Now"}
      </button>
    </div>
  );
}