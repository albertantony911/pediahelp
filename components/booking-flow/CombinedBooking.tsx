'use client';

import { useState } from 'react';
import { useBookingStore } from '@/store/bookingStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Script from 'next/script';

export default function CombinedBooking() {
  const {
    patient,
    setPatient,
    selectedDoctor,
    selectedSlot,
    confirmedBookingId,
    setConfirmedBookingId,
    setStep,
    reset,
  } = useBookingStore();

  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [otp, setOtp] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmitForm = async () => {
    if (!selectedDoctor || !selectedSlot) {
      toast.error('Please select a doctor and slot first');
      return;
    }
    const { parentName, childName, phone, email } = patient;
    if (!parentName.trim() || !childName.trim() || !phone.trim() || !email.trim()) {
      toast.error('All fields are required');
      return;
    }

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
    if (res.ok && data.bookingId) {
      setConfirmedBookingId(data.bookingId);
      setIsFormSubmitted(true);
      toast.success('OTP sent! Check your phone/email');
    } else {
      toast.error(data?.error || 'Booking failed');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    if (!confirmedBookingId || otp.length !== 6) {
      toast.error('Enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/heimdall/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: confirmedBookingId, otp }),
    });

    const data = await res.json();
    if (data.success) {
      setIsOtpVerified(true);
      toast.success('OTP verified!');
    } else {
      toast.error('Invalid OTP');
    }
    setLoading(false);
  };

  const handlePay = async () => {
    if (!confirmedBookingId) {
      toast.error('Missing booking ID');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/heimdall/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: confirmedBookingId }),
    });

    const data = await res.json();
    if (!res.ok || !data.orderId) {
      toast.error(data?.error || 'Payment failed');
      setLoading(false);
      return;
    }

    const { orderId, amount, doctor, slot, keyId } = data;
    const razorpay = new (window as any).Razorpay({
      key: keyId,
      amount,
      currency: 'INR',
      name: doctor.name,
      description: 'PediaHelp Appointment',
      order_id: orderId,
      handler: function () {
        toast.success('Payment successful!');
        setStep(3); // Move to success step
      },
      prefill: {},
      notes: { appointment_slot: slot },
      theme: { color: '#00B4D8' },
    });

    razorpay.open();
    setLoading(false);
  };

  const formattedDate = selectedSlot
    ? format(new Date(selectedSlot), "EEE, MMM d yyyy 'at' h:mm a")
    : '';

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="w-full max-w-3xl mx-auto px-4 py-6 space-y-6">
        <h2 className="text-xl font-semibold">Book Your Appointment</h2>

        {/* Form Section */}
        {!isFormSubmitted && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
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
            <Button onClick={handleSubmitForm} disabled={loading} className="w-full">
              Send OTP
            </Button>
          </motion.div>
        )}

        {/* OTP Section */}
        {isFormSubmitted && !isOtpVerified && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter the OTP sent to your phone/email</p>
            <InputOTP maxLength={6} value={otp} onChange={setOtp} className="justify-center">
              <InputOTPGroup>
                {Array.from({ length: 6 }).map((_, i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <Button onClick={handleVerifyOtp} disabled={loading || otp.length !== 6} className="w-full">
              Verify OTP
            </Button>
          </motion.div>
        )}

        {/* Payment Section */}
        {isOtpVerified && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm text-muted-foreground">Review and pay to confirm your appointment</p>
            <Button onClick={handlePay} disabled={loading} className="w-full">
              Pay ₹{selectedDoctor?.appointmentFee} Now
            </Button>
          </motion.div>
        )}

        {/* Sticky Summary */}
        {selectedDoctor && selectedSlot && (
          <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t shadow-lg max-w-3xl mx-auto">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{selectedDoctor.name}</p>
                <p className="text-sm text-muted-foreground">{formattedDate}</p>
              </div>
              <p className="font-semibold">₹{selectedDoctor.appointmentFee}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}