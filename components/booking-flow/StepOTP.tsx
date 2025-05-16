//components/booking-flow/StepOTP.tsx
'use client';

import { useBookingStore } from '@/store/bookingStore';

export default function StepOTP() {
  const setStep = useBookingStore((s) => s.setStep);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Verify OTP</h2>
      <button
        onClick={() => {
          // simulate OTP verification
          setStep(3);
        }}
        className="btn"
      >
        Continue
      </button>
    </div>
  );
}