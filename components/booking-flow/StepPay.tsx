// Refactored StepPay.tsx
'use client';

import { useBookingStore } from '@/store/bookingStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Script from 'next/script';
import { format } from 'date-fns';

export default function StepPay() {
  const {
    confirmedBookingId,
    selectedDoctor,
    selectedSlot,
    setStep,
    reset,
  } = useBookingStore();

  const handlePay = async () => {
    if (!confirmedBookingId) {
      toast.error('Missing booking ID');
      return;
    }

    const res = await fetch('/api/heimdall/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: confirmedBookingId })
    });

    const data = await res.json();
    if (!res.ok || !data.orderId) {
      toast.error(data?.error || 'Failed to initialize payment');
      return;
    }

    const { orderId, amount, doctor, slot, keyId } = data;

    const razorpay = new (window as any).Razorpay({
      key: keyId,
      amount,
      currency: 'INR',
      name: doctor.name,
      description: 'PediaHelp Appointment',
      order_id: orderId,
      handler: function () {
        toast.success('Payment Successful');
        setStep(3); // Success step
      },
      prefill: {},
      notes: {
        appointment_slot: slot
      },
      theme: {
        color: '#00B4D8'
      }
    });

    razorpay.open();
  };

  const formattedDate = selectedSlot
    ? format(new Date(selectedSlot), "EEE, MMM d yyyy 'at' h:mm a")
    : '';

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-center">Review & Pay</h2>

        {selectedDoctor && selectedSlot && (
          <div className="bg-muted border rounded-xl p-4 text-left max-w-md mx-auto">
            <div className="flex gap-4 items-center">
              {selectedDoctor.photo?.asset?.url && (
                <img
                  src={selectedDoctor.photo.asset.url}
                  alt={selectedDoctor.name}
                  className="w-14 h-14 object-cover rounded-full border"
                />
              )}
              <div>
                <div className="font-medium text-lg">{selectedDoctor.name}</div>
                <div className="text-sm text-muted-foreground">{formattedDate}</div>
                <div className="text-sm font-semibold mt-1">
                  Fee: ₹{selectedDoctor.appointmentFee}
                </div>
              </div>
            </div>
          </div>
        )}

        <Button onClick={handlePay} className="w-full">
          Pay & Confirm Appointment
        </Button>

        <Button onClick={reset} variant="ghost" className="w-full">
          Start Over
        </Button>
      </div>
    </>
  );
}
