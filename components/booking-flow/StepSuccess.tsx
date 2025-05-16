'use client';

import { useBookingStore } from '@/store/bookingStore';

export default function StepSuccess() {
  const reset = useBookingStore((s) => s.reset);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Booking Confirmed!</h2>
      <button
        onClick={() => {
          reset(); // Use the built-in method instead of manual resets
        }}
        className="btn"
      >
        Reset
      </button>
    </div>
  );
}