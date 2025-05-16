// Refactored StepForm.tsx
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
    if (!selectedDoctor || !selectedSlot) {
      toast.error("Missing doctor or slot");
      return;
    }

    const { parentName, childName, phone, email } = patient;
    if (!parentName.trim() || !childName.trim() || !phone.trim() || !email.trim()) {
      toast.error("All fields are required");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/heimdall/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: selectedDoctor._id,
        slot: selectedSlot,
        patient,
      }),
    });

    const data = await res.json();
    if (res.ok && data.bookingId) {
      setConfirmedBookingId(data.bookingId);
      toast.success("OTP sent! Check your phone/email/WhatsApp");
    } else {
      toast.error(data?.error || "Booking failed");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!confirmedBookingId || otp.length !== 6) return;

    setLoading(true);
    const res = await fetch('/api/heimdall/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: confirmedBookingId, otp }),
    });

    const data = await res.json();
    if (data.success) {
      setOtpStatus('verified');
      toast.success('OTP Verified!');
      setStep(2); // Proceed to pay step
    } else {
      toast.error('Invalid OTP. Try again');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Enter Appointment Details</h2>

      <div className="space-y-4">
        <Input
          placeholder="Parent's Name"
          value={patient.parentName}
          onChange={(e) => setPatient({ ...patient, parentName: e.target.value })}
          disabled={!!confirmedBookingId}
        />
        <Input
          placeholder="Child's Name"
          value={patient.childName}
          onChange={(e) => setPatient({ ...patient, childName: e.target.value })}
          disabled={!!confirmedBookingId}
        />
        <Input
          placeholder="Email"
          type="email"
          value={patient.email}
          onChange={(e) => setPatient({ ...patient, email: e.target.value })}
          disabled={!!confirmedBookingId}
        />
        <Input
          placeholder="Phone Number"
          type="tel"
          value={patient.phone}
          onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
          disabled={!!confirmedBookingId}
        />

        {confirmedBookingId ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">OTP sent. Please verify below.</div>

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

            <Button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6} className="w-full">
              Verify OTP
            </Button>
          </div>
        ) : (
          <Button onClick={handleSendOtp} disabled={loading} className="w-full">
            Send OTP & Continue
          </Button>
        )}
      </div>
    </div>
  );
}