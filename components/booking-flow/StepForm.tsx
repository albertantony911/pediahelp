// components/booking-flow/StepForm.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBookingStore } from '@/store/bookingStore';

/** ---------- TUNABLES ---------- */
const RESEND_COOLDOWN_BASE = 30; // seconds
const MAX_RESENDS = 3;
const OTP_LENGTH = 6;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string | undefined;
/** ------------------------------ */

export default function StepForm() {
  const {
    selectedDoctor,
    selectedSlot,
    patient,
    setPatient,
    setOtp,
    setOtpStatus,
    setStep,
    setConfirmedBookingId,
    otp,
    appointmentId,
  } = useBookingStore();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [timer, setTimer] = useState(RESEND_COOLDOWN_BASE);
  const [resendCount, setResendCount] = useState(0);
  const [startedAt, setStartedAt] = useState<number>(Date.now());

  const otpInputsRef = useRef<HTMLInputElement[]>([]);
  const recaptchaCacheRef = useRef<{ token: string; ts: number } | null>(null);

  /* ----------------------- Helpers ----------------------- */

  const validateFields = () => {
    const next: Record<string, string> = {};
    if (!patient.parentName) next.parentName = 'Parent’s name is required';
    if (!patient.childName) next.childName = 'Child’s name is required';
    if (!patient.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email)) {
      next.email = 'Valid email is required';
    }
    if (!patient.phone || !/^\d{10}$/.test(patient.phone)) {
      next.phone = 'Valid 10-digit phone is required';
    }
    if (!selectedDoctor?._id || !selectedSlot) {
      next.meta = 'Please select a slot again';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const getRecaptchaToken = async (): Promise<string> => {
    try {
      const now = Date.now();
      if (recaptchaCacheRef.current && now - recaptchaCacheRef.current.ts < 30_000) {
        return recaptchaCacheRef.current.token;
      }
      const keyFromMeta =
        typeof document !== 'undefined'
          ? document.querySelector<HTMLMetaElement>('meta[name="recaptcha-site-key"]')?.content
          : '';
      const siteKey = RECAPTCHA_SITE_KEY || (window as any)?.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || keyFromMeta || '';
      const grecaptcha = (window as any)?.grecaptcha;
      if (!siteKey || !grecaptcha?.execute || !grecaptcha?.ready) return '';
      await new Promise<void>((resolve) => grecaptcha.ready(() => resolve()));
      const token = await grecaptcha.execute(siteKey, { action: 'submit' });
      if (token) recaptchaCacheRef.current = { token, ts: now };
      return token || '';
    } catch {
      return '';
    }
  };

  /* ------------------- Countdown (resend) ------------------- */

  useEffect(() => {
    if (!otpSent || otpVerified || timer === 0) return;
    const id = setInterval(() => setTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [timer, otpSent, otpVerified]);

  /* ------------------- OTP send / verify ------------------- */

  const handleSendOtp = async () => {
    if (!validateFields()) {
      const first = Object.values(errors)[0];
      if (first) toast.error(first);
      return;
    }
    if (resendCount >= MAX_RESENDS) {
      toast.error(`Maximum OTP resend limit of ${MAX_RESENDS} reached`);
      return;
    }

    setIsSendingOtp(true);
    try {
      const token = await getRecaptchaToken();
      if (!token) {
        toast.error('reCAPTCHA not ready — try again in a moment');
        return;
      }

      // Prefer email if valid, else SMS (+91)
      const identifier =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patient.email)
          ? patient.email.trim()
          : `+91${patient.phone}`;

      const res = await fetch('/api/verify/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          channel: 'auto',
          scope: 'booking',
          recaptchaToken: token,
          startedAt,
          // Honeypot optional (not using here)
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setSessionId(data.sessionId);
      setOtpSent(true);
      setTimer(RESEND_COOLDOWN_BASE + resendCount * 10);
      setResendCount((c) => c + 1);
      setOtp(''); // clear input
      otpInputsRef.current[0]?.focus();
      toast.success('OTP sent');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
      setStartedAt(Date.now());
    }
  };

  const handleVerifyOtp = async () => {
    if (!sessionId || otp.length !== OTP_LENGTH) return;
    setIsVerifying(true);
    try {
      const verifyRes = await fetch('/api/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, otp }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok || !verifyJson.ok) throw new Error(verifyJson.error || 'OTP verification failed');

      setOtpStatus('verified');
      setOtpVerified(true);
      toast.success('OTP verified');

      // Create booking AFTER OTP verify
      const create = await fetch('/api/heimdall/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctor!._id,
          slot: selectedSlot!,
          patient: {
            parentName: patient.parentName,
            childName: patient.childName,
            phone: patient.phone,
            email: patient.email,
          },
        }),
      });
      const createJson = await create.json();
      if (!create.ok || !createJson.bookingId) throw new Error(createJson.error || 'Failed to create booking');

      setConfirmedBookingId(createJson.bookingId);
      // Go pay
      await handlePayment(createJson.bookingId);
    } catch (e: any) {
      toast.error(e?.message || 'Verification failed, please try again.');
      setOtpVerified(false);
      setOtpStatus('failed');
    } finally {
      setIsVerifying(false);
    }
  };

  /* ------------------- Payment ------------------- */

  const handlePayment = async (bookingId: string) => {
    setIsPaying(true);
    try {
      const res = await fetch('/api/heimdall/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok || !data.orderId) {
        toast.error(data?.error || 'Failed to initialize payment');
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
    } catch (e: any) {
      toast.error(e?.message || 'Payment failed to start');
    } finally {
      setIsPaying(false);
    }
  };

  /* ------------------- OTP input UI ------------------- */

  const handleOtpChange = (index: number, value: string, e?: React.ChangeEvent<HTMLInputElement>) => {
    if (!/^\d?$/.test(value)) return;
    const arr = otp.split('');
    arr[index] = value;
    const next = arr.join('');
    setOtp(next);

    if (value && index < OTP_LENGTH - 1) otpInputsRef.current[index + 1]?.focus();
    else if (
      !value &&
      index > 0 &&
      e?.target.selectionStart === 0 &&
      (e?.nativeEvent as any)?.inputType === 'deleteContentBackward'
    ) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpInputsRef.current[index]?.value && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
      const arr = otp.split('');
      arr[index - 1] = '';
      setOtp(arr.join(''));
    } else if (event.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const renderField = (id: keyof typeof patient, label: string, type: string = 'text') => (
    <div className="relative">
      <Input
        id={id}
        type={type}
        value={patient[id]}
        onChange={(e) => setPatient({ ...patient, [id]: e.target.value })}
        placeholder={label}
        className={cn(errors[id] && 'border-red-500')}
      />
      {errors[id] && <p className="text-xs text-red-500 mt-1">{errors[id]}</p>}
    </div>
  );

  /* ------------------- UI ------------------- */

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      {/* If using reCAPTCHA v3 */}
      <Script src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY ?? ''}`} strategy="lazyOnload" />

      <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-lg space-y-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-center">Confirm Your Appointment</h2>

        {/* Patient fields */}
        {!otpSent && (
          <div className="space-y-3">
            {renderField('parentName', "Parent's Name")}
            {renderField('childName', "Child's Name")}
            {renderField('email', 'Email', 'email')}
            {renderField('phone', 'Phone (10 digits)', 'tel')}

            <Button onClick={handleSendOtp} disabled={isSendingOtp} className="w-full rounded-xl">
              {isSendingOtp ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP…</> : 'Send OTP & Continue'}
            </Button>
            {errors.meta && <p className="text-xs text-red-500">{errors.meta}</p>}
          </div>
        )}

        {/* OTP step */}
        {otpSent && (
          <div className="space-y-3">
            <label className="text-sm text-gray-600">Enter the 6-digit OTP</label>

            <div className="flex justify-center gap-2 rounded-xl p-1.5 bg-gray-50">
              {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <motion.input
                  key={i}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="w-10 h-12 text-lg text-center rounded-md border border-gray-300 bg-white/70 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                  ref={(el) => {
                    if (el) otpInputsRef.current[i] = el;
                  }}
                  value={otp[i] || ''}
                  onChange={(e) => handleOtpChange(i, e.target.value, e)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                />
              ))}
            </div>

            {!otpVerified && (
              <div className="flex items-center justify-between text-xs text-gray-500">
                {timer > 0 ? (
                  <span>Resend in 0:{timer.toString().padStart(2, '0')}</span>
                ) : (
                  <button
                    onClick={handleSendOtp}
                    disabled={resendCount >= MAX_RESENDS || isSendingOtp}
                    className={cn(
                      'text-teal-700 font-medium',
                      (resendCount >= MAX_RESENDS || isSendingOtp) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    Resend OTP
                  </button>
                )}
                <span className="text-gray-400">via email/SMS</span>
              </div>
            )}

            {!otpVerified && (
              <Button
                onClick={handleVerifyOtp}
                disabled={otp.length !== OTP_LENGTH || isVerifying}
                className="w-full rounded-xl"
              >
                {isVerifying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…</> : 'Verify & Pay'}
              </Button>
            )}

            <AnimatePresence>
              {otpVerified && (
                <motion.div
                  className="flex items-center justify-center gap-2 text-green-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CheckCircle className="w-4 h-4" />
                  <p className="text-sm">OTP Verified</p>
                </motion.div>
              )}
            </AnimatePresence>

            {otpVerified && (
              <Button disabled={isPaying} onClick={() => { /* guarded; payment auto-starts on verify */ }} className="w-full rounded-xl">
                {isPaying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</> : 'Processing Payment…'}
              </Button>
            )}
          </div>
        )}
      </div>
    </>
  );
}