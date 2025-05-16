//components/booking-flow/StepPay.tsx
'use client';

import { useBookingStore } from '@/store/bookingStore';

export default function StepPay() {
  const setStep = useBookingStore((s) => s.setStep);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Make Payment</h2>
      <button
        onClick={() => {
          // simulate payment
          setStep(3);
        }}
        className="btn"
      >
        Continue
      </button>
    </div>
  );
}