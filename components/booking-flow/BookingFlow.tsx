'use client';

import { useBookingStore } from '@/store/bookingStore';
import StepSlot from './StepSlot';
import StepForm from './StepForm';
import StepOTP from './StepOTP';
import StepPay from './StepPay';
import StepSuccess from './StepSuccess';

export default function BookingFlow() {
  const step = useBookingStore((s) => s.step);

  return (
    <div className="max-w-xl mx-auto p-4">
      {step === 0 && <StepSlot />}
      {step === 1 && <StepForm />}
      {step === 2 && <StepOTP />}
      {step === 3 && <StepPay />}
      {step === 4 && <StepSuccess />}
    </div>
  );
}