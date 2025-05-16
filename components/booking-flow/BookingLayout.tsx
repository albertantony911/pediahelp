'use client';

import { useBookingStore } from '@/store/bookingStore';
import StepSlot from './StepSlot';
import StepForm from './StepForm';
import StepPay from './StepPay';
import StepSuccess from './StepSuccess';

export default function BookingLayout() {
  const { step } = useBookingStore();

  const steps = [
    <StepSlot key="slot" />,
    <StepForm key="form" />,
    <StepPay key="pay" />,
    <StepSuccess key="success" />,
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      {/* Optional: Step Indicator */}
      <div className="mb-6 flex items-center justify-between text-sm text-gray-600">
        {['Slot', 'Form', 'Pay', 'Done'].map((label, idx) => (
          <div key={label} className={`flex-1 text-center ${step === idx ? 'font-bold text-primary' : ''}`}>
            {label}
          </div>
        ))}
      </div>

      {/* Active Step Component */}
      <div>{steps[step]}</div>
    </div>
  );
}