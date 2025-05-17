'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle } from 'lucide-react';
import Script from 'next/script';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useBookingStore } from '@/store/bookingStore';

export default function StepForm() {
  const {
    selectedDoctor,
    selectedSlot,
    patient,
    setPatient,
    setOtp,
    setOtpStatus,
    setStep,
    confirmedBookingId,
    setConfirmedBookingId,
    otp,
    appointmentId,
  } = useBookingStore();

  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [timer, setTimer] = useState(30);
  const otpInputsRef = useRef<HTMLInputElement[]>([]);

  // Auto-resend OTP countdown
  useEffect(() => {
    if (!otpSent || otpVerified || timer === 0) return;
    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer, otpSent, otpVerified]);

  const validateFields = () => {
    const newErrors: typeof errors = {};
    if (!patient.parentName) newErrors.parentName = 'Parent’s name is required';
    if (!patient.childName) newErrors.childName = 'Child’s name is required';
    if (!patient.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email)) {
      newErrors.email = 'Valid email is required';
    }
    if (!patient.phone || !/^\d{10}$/.test(patient.phone)) {
      newErrors.phone = 'Valid 10-digit phone number is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async () => {
    if (!validateFields() || !selectedDoctor || !selectedSlot) {
      toast.error('Please fill all fields correctly');
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
      setOtpSent(true);
      setTimer(30);
      toast.success('OTP sent');
      otpInputsRef.current[0]?.focus();
    } else {
      toast.error(data?.error || 'Failed to send OTP');
    }
    setLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const otpArr = otp.split('');
    otpArr[index] = value;
    const newOtp = otpArr.join('');
    setOtp(newOtp);

    if (value && index < 5) otpInputsRef.current[index + 1]?.focus();
    if (!value && index > 0) otpInputsRef.current[index - 1]?.focus();
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
      toast.success('OTP verified');
      setOtpStatus('verified');
      setOtpVerified(true);
    } else {
      toast.error('Invalid OTP');
    }
    setLoading(false);
  };

  const handlePayment = async () => {
    if (!confirmedBookingId) return;
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

    const razorpay = new (window as any).Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: 'INR',
      name: data.doctor.name,
      description: 'PediaHelp Appointment',
      order_id: data.orderId,
      handler: () => setStep(2),
      notes: { appointmentId },
      theme: { color: '#00B4D8' },
    });

    razorpay.open();
    setLoading(false);
  };

const renderField = (id: keyof typeof patient, label: string, type: string = 'text') => (
  <div className="relative">
    <input
      type={type}
      required
      value={patient[id]}
      onChange={(e) => setPatient({ ...patient, [id]: e.target.value })}
      placeholder=" "      // important for peer-placeholder-shown
      className={cn(
        'peer w-full pt-6 pb-2 px-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-300 transition-all',
        errors[id] && 'border-red-500'
      )}
      id={id}
    />
    <label
      htmlFor={id}
      className="
        absolute left-4 top-1 text-xs text-gray-400 transition-all
        peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm
      "
    >
      {label}
    </label>
    {errors[id] && <p className="text-xs text-red-500 mt-1">{errors[id]}</p>}
  </div>
);

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-lg space-y-6">
        <h2 className="text-xl font-semibold text-center">Confirm Your Appointment</h2>

        {renderField('parentName', "Parent's Name")}
        {renderField('childName', "Child's Name")}
        {renderField('email', 'Email', 'email')}
        {renderField('phone', 'Phone', 'tel')}

        {!otpSent && (
          <Button onClick={handleSendOtp} disabled={loading} className="w-full">
            {loading ? 'Sending OTP...' : 'Send OTP & Continue'}
          </Button>
        )}

        {otpSent && (
          <div className="space-y-4">
            <label className="text-sm text-gray-600">Enter 6-digit OTP</label>
            <div className="flex justify-center gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                  <input
                        key={i}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        className="w-10 h-12 text-lg text-center border border-gray-300 rounded-md focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                        ref={(el) => {
                        if (el) otpInputsRef.current[i] = el;
                        }}
                        value={otp[i] || ''}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                            e.preventDefault();
                            const otpArr = otp.split('');
                            if (otpArr[i]) {
                            // If current box has a digit, clear it
                            otpArr[i] = '';
                            setOtp(otpArr.join(''));
                            } else if (i > 0) {
                            // Otherwise move to and clear the previous box
                            otpInputsRef.current[i - 1]?.focus();
                            otpArr[i - 1] = '';
                            setOtp(otpArr.join(''));
                            }
                        }
                        }}
                    />
                    ))}
            </div>

            {!otpVerified && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Resend in 0:{timer.toString().padStart(2, '0')}</span>
                <button
                  onClick={handleSendOtp}
                  disabled={timer > 0}
                  className={cn(timer > 0 && 'opacity-50 cursor-not-allowed', 'text-teal-600')}
                >
                  Resend OTP
                </button>
              </div>
            )}

            {!otpVerified && (
              <Button
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6 || loading}
                className="w-full"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </Button>
            )}

            {otpVerified && (
              <motion.div
                className="flex items-center justify-center gap-2 text-green-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <CheckCircle className="w-4 h-4" />
                <p className="text-sm">OTP Verified</p>
              </motion.div>
            )}
          </div>
        )}

        <AnimatePresence>
          {otpVerified && (
            <motion.div
              className="pt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Button onClick={handlePayment} className="w-full">
                {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : 'Pay & Confirm Appointment'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}