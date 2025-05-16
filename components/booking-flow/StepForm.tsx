//components/booking-flow/StepForm.tsx
'use client';

import { useBookingStore } from '@/store/bookingStore';

export default function StepForm() {
  const setStep = useBookingStore((s) => s.setStep);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Enter Patient Details</h2>
      <button
        onClick={() => {
          // simulate form submission
          setStep(2);
        }}
        className="btn"
      >
        Continue
      </button>
    </div>
  );
}