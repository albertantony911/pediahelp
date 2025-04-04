'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const bookingId = searchParams.get('bookingId');
  const amount = searchParams.get('amount');

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (!amount || !bookingId) return;
    setLoading(true);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      alert('Failed to load Razorpay SDK. Please try again.');
      setLoading(false);
      return;
    }

    const response = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseInt(amount) * 100, bookingId }),
    });

    const { orderId } = await response.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: parseInt(amount) * 100,
      currency: 'INR',
      name: 'Your Company Name',
      description: `Payment for Booking #${bookingId}`,
      order_id: orderId,
      handler: async function (response: RazorpayResponse) {
        const verifyResponse = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...response,
            bookingId,
          }),
        });

        const result = await verifyResponse.json();
        if (result.success) {
          await confirmBooking(bookingId);
          router.push(`/payment/confirmation?bookingId=${bookingId}`);
        } else {
          router.push(`/payment/failed?bookingId=${bookingId}`);
        }
      },
      prefill: {
        name: 'Customer Name',
        email: 'customer@example.com',
        contact: '9999999999',
      },
      theme: { color: '#3399cc' },
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
    setLoading(false);
  };

  const confirmBooking = async (bookingId: string) => {
    console.log(`Confirming booking ${bookingId}`);
    // Call your own API or Zcal here
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
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading payment options...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
