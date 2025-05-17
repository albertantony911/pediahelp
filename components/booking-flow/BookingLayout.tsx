'use client';

import { useBookingStore } from '@/store/bookingStore';
import StepSlot from './StepSlot';
import StepForm from './StepForm';
import StepSuccess from './StepSuccess';

export default function BookingLayout() {
  const { step } = useBookingStore();

  const steps = [
    <StepSlot key="slot" />,
    <StepForm key="form" />,
    <StepSuccess key="success" />,
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <div>{steps[step]}</div>
    </div>
  );
}