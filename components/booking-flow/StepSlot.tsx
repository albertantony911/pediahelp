'use client';

import { useBookingStore } from '@/store/bookingStore';

export default function StepSlot() {
  const setStep = useBookingStore((s) => s.setStep);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Select a Slot</h2>
      <button
        onClick={() => {
          // simulate slot selection
          setStep(1);
        }}
        className="btn"
      >
        Continue
      </button>
    </div>
  );
}