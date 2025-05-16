'use client';

import { useState } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

export default function StepForm() {
  const {
    patient,
    setPatient,
    setOtpStatus,
    otpStatus,
    confirmedBookingId,
    setConfirmedBookingId,
    selectedDoctor,
    selectedSlot,
    setStep,
  } = useBookingStore();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!selectedDoctor || !selectedSlot) return;

    setLoading(true);
    const res = await fetch('/api/heimdall/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctorId: selectedDoctor._id,
        slot: selectedSlot,
        patient,
      }),
    });

    const data = await res.json();
    if (data.bookingId) {
      setConfirmedBookingId(data.bookingId);
      toast.success('OTP sent! Check your phone, email, and WhatsApp');
    } else {
      toast.error('Booking failed. Please try again');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!confirmedBookingId || otp.length !== 6) return;

    setLoading(true);
    const res = await fetch('/api/heimdall/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: confirmedBookingId, otp }),
    });
    const data = await res.json();
    if (data.success) {
      setOtpStatus('verified');
      toast.success('OTP Verified!');
      setStep(3); // Proceed to payment
    } else {
      toast.error('Invalid OTP. Try again');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Enter Your Details</h2>

      <Input
        placeholder="Parent's Name"
        value={patient.parentName}
        onChange={(e) => setPatient({ ...patient, parentName: e.target.value })}
      />
      <Input
        placeholder="Child's Name"
        value={patient.childName}
        onChange={(e) => setPatient({ ...patient, childName: e.target.value })}
      />
      <Input
        placeholder="Phone Number"
        type="tel"
        value={patient.phone}
        onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
      />
      <Input
        placeholder="Email"
        type="email"
        value={patient.email}
        onChange={(e) => setPatient({ ...patient, email: e.target.value })}
      />

      {confirmedBookingId ? (
        <div className="space-y-4">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            className="justify-center"
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <Button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}>
            Verify OTP
          </Button>
        </div>
      ) : (
        <Button onClick={handleSendOtp} disabled={loading}>
          Send OTP & Proceed
        </Button>
      )}
    </div>
  );
}