'use client';

import { useBookingStore } from '@/store/bookingStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Script from 'next/script';

export default function StepPay() {
  const {
    confirmedBookingId,
    setStep,
    selectedDoctor,
    selectedSlot,
  } = useBookingStore();

  const handlePay = async () => {
    if (!confirmedBookingId) {
      toast.error('Booking ID missing');
      return;
    }

    const res = await fetch('/api/heimdall/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: confirmedBookingId }),
    });

    const data = await res.json();
    if (!res.ok || !data.orderId) {
      toast.error('Failed to initialize payment');
      return;
    }

    const { orderId, amount, doctor, slot, keyId } = data;

    const razorpay = new (window as any).Razorpay({
      key: keyId,
      amount,
      currency: 'INR',
      name: doctor.name,
      description: 'PediaHelp Appointment',
      image: '/logo.png', // Optional
      order_id: orderId,
      handler: function (response: any) {
        toast.success('Payment Successful');
        setStep(3); // Move to Success step
      },
      prefill: {
        name: doctor.name,
        email: '', // Optional
        contact: '', // Optional
      },
      notes: {
        appointment_slot: slot,
      },
      theme: {
        color: '#00B4D8',
      },
    });

    razorpay.open();
  };

  return (
    <>
      {/* Razorpay script injected once */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold">Complete Your Payment</h2>
        <p>Pay to confirm your appointment with <strong>{selectedDoctor?.name}</strong></p>
        <Button onClick={handlePay}>Pay & Confirm</Button>
      </div>
    </>
  );
}