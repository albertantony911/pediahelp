'use client';

import { useBookingStore } from '@/store/bookingStore';
import StepSlot from './StepSlot';
import StepForm from './StepForm';
import StepSuccess from './StepSuccess';
import Stepper from './Stepper';

export default function BookingLayout() {
  const { step } = useBookingStore();

  const steps = [<StepSlot key="slot" />, <StepForm key="form" />, <StepSuccess key="success" />];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-5 md:px-6 py-6 md:pt-40">
      <Stepper step={step} />
      <div>{steps[step]}</div>
    </div>
  );
}