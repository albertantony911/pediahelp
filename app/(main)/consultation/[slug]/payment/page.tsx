// app/consultation/[slug]/payment/page.tsx

'use client'

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button'; // Customize this based on your button component

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get('slug');
  const [amount, setAmount] = useState(0);  // You may get the amount dynamically from Sanity
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Make a request to the backend to create an order
      const res = await fetch(`/api/create-order?slug=${slug}`, { method: 'POST' });
      const data = await res.json();

      if (res.ok && data?.order_id) {
        const options = {
          key: 'your_razorpay_key', // Replace with your Razorpay key
          amount: data.amount, // in paise
          currency: 'INR',
          name: 'Pediahelp',
          description: 'Consultation Payment',
          order_id: data.order_id,
          handler: function (response) {
            // Handle payment success
            toast.success('Payment successful!');
            router.push(`/consultation/${slug}/confirmation`);
          },
          prefill: {
            name: 'User Name',
            email: 'user@example.com',
            contact: '+919876543210',
          },
        };

        const rzp = new Razorpay(options);
        rzp.open();
      } else {
        toast.error('Payment failed!');
      }
    } catch (error) {
      console.error('Error initiating payment:', error);
      toast.error('Payment failed!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-2xl font-bold mb-4">Complete Your Payment</h1>
      <p className="text-lg">Please complete your payment for the consultation.</p>
      
      {/* Razorpay Payment Button */}
      <Button onClick={handlePayment} disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </Button>
    </div>
  );
}