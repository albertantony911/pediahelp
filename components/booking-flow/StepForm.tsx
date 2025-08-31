'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Script from 'next/script';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, Calendar, Clock } from 'lucide-react';
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

/* --------------------- Glass helpers (match StepSlot) ---------------------- */
const glassWrap =
  'rounded-3xl border border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-xl shadow-[0_12px_60px_-18px_rgba(0,0,0,0.35)]';
const glassChip =
  'rounded-xl border border-white/15 bg-white/10 dark:bg-white/5 backdrop-blur-xl shadow-[0_2px_16px_-8px_rgba(0,0,0,0.35)]';

// Define Field OUTSIDE StepForm to prevent re-definition on re-renders
interface FieldProps {
  id: 'parentName' | 'childName' | 'email' | 'phone';
  label: string;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
  value: string;
  onChange: (newValue: string) => void;
  error?: string;
}

const Field = ({
  id,
  label,
  type = 'text',
  disabled = false,
  placeholder,
  value,
  onChange,
  error,
}: FieldProps) => (
  <div className="relative">
    <label htmlFor={id} className="block text-xs md:text-sm text-white/80 mb-1.5">
      {label}
    </label>
    <Input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || label}
      disabled={disabled}
      className={cn(
        'rounded-xl bg-white/80 text-gray-900 placeholder:text-gray-500 border border-white/30 focus:border-teal-500 focus:ring-2 focus:ring-teal-200',
        disabled && 'opacity-70 pointer-events-none',
        error && 'border-red-500 focus:ring-red-200 focus:border-red-500'
      )}
    />
    {error && <p className="text-xs text-red-300 mt-1">{error}</p>}
  </div>
);

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
    setSelectedSlot,
  } = useBookingStore();

  // ✅ Local state to prevent input blur/keyboard collapse on phones
  const [localPatient, setLocalPatient] = useState({
    parentName: patient.parentName ?? '',
    childName: patient.childName ?? '',
    email: patient.email ?? '',
    phone: patient.phone ?? '',
  });

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

  const formattedWhen = useMemo(() => {
    if (!selectedSlot) return '';
    const d = new Date(selectedSlot);
    const date = d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' });
    const time = d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
    return `${date}  •  ${time}`;
  }, [selectedSlot]);

  const photoUrl = selectedDoctor?.photo?.asset?.url || '/doctor-placeholder.jpg';
  const docName = selectedDoctor?.name || 'Doctor';
  const docSpec = selectedDoctor?.specialty || '';
  const feeAmount = (selectedDoctor as any)?.fee ?? (selectedDoctor as any)?.price ?? null; // adjust keys if needed

  /* ----------------------- Validation & captcha ----------------------- */
  const validateFields = () => {
    const next: Record<string, string> = {};
    if (!localPatient.parentName) next.parentName = 'Parent’s name is required';
    if (!localPatient.childName) next.childName = 'Child’s name is required';
    if (!localPatient.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localPatient.email)) next.email = 'Valid email is required';
    if (!localPatient.phone || !/^\d{10}$/.test(localPatient.phone)) next.phone = 'Valid 10-digit phone is required';
    if (!selectedDoctor?._id || !selectedSlot) next.meta = 'Please select a slot again';
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

  /* ------------------- Flow: Continue -> Send OTP ------------------- */
  const handleContinue = async () => {
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
      // ✅ Push local form snapshot to global store ONLY once (prevents re-renders while typing)
      setPatient({
        ...patient,
        parentName: localPatient.parentName,
        childName: localPatient.childName,
        email: localPatient.email,
        phone: localPatient.phone,
      });

      const token = await getRecaptchaToken();
      if (!token) {
        toast.error('reCAPTCHA not ready — try again in a moment');
        return;
      }

      const identifier =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(localPatient.email)
          ? localPatient.email.trim()
          : `+91${localPatient.phone}`;

      const res = await fetch('/api/verify/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          channel: 'auto',
          scope: 'booking',
          recaptchaToken: token,
          startedAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setSessionId(data.sessionId);
      setOtpSent(true);
      setTimer(RESEND_COOLDOWN_BASE + resendCount * 10);
      setResendCount((c) => c + 1);
      setOtp(''); // clear input
      setTimeout(() => otpInputsRef.current[0]?.focus(), 60);
      toast.success('OTP sent');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
      setStartedAt(Date.now());
    }
  };

  const handleResend = async () => {
    if (resendCount >= MAX_RESENDS || isSendingOtp) return;
    await handleContinue();
  };

  /* ------------------- Verify + Create + Pay ------------------- */
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
            parentName: localPatient.parentName,
            childName: localPatient.childName,
            phone: localPatient.phone,
            email: localPatient.email,
          },
        }),
      });
      const createJson = await create.json();
      if (!create.ok || !createJson.bookingId) throw new Error(createJson.error || 'Failed to create booking');

      setConfirmedBookingId(createJson.bookingId);
      await handlePayment(createJson.bookingId);
    } catch (e: any) {
      toast.error(e?.message || 'Verification failed, please try again.');
      setOtpVerified(false);
      setOtpStatus('failed');
    } finally {
      setIsVerifying(false);
    }
  };

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

  /* ------------------- OTP input handlers ------------------- */
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

  /* ------------------- Back to slots ------------------- */
  const handleBackToSlots = () => {
    setSelectedSlot(null);
    setStep(0);
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <Script src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY ?? ''}`} strategy="lazyOnload" />

      {/* Background wash to match StepSlot */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-80"
        style={{
          background:
            'radial-gradient(62rem 62rem at 18% -12%, rgba(202,215,110,0.18), transparent 60%), ' +
            'radial-gradient(52rem 52rem at 90% 10%, rgba(28,148,123,0.20), transparent 60%)',
        }}
      />

      <div className={cn(glassWrap, 'max-w-md mx-auto px-5 sm:px-6 py-5 text-white')}>
        {/* Summary header row */}
        <div className={cn(glassChip, 'p-4')}>
          <div className="flex items-start gap-4">
            <motion.img
              initial={{ opacity: 0.85 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              src={photoUrl}
              alt={docName}
              className="w-[56px] h-[65px] sm:w-[64px] sm:h-[84px] md:w-[65px] md:h-[80px] rounded-2xl object-cover border border-white/30 shadow shrink-0"
              style={{ aspectRatio: '3 / 4' }}
            />
            <div className="flex-1 min-w-0">
              {/* ✅ Title above doctor name */}
              <div className="text-sm md:text-lg tracking-[0.14em] text-white/70 mb-1 font-thin">
                APPOINTMENT WITH
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm md:text-base min-w-0">
                <span className="font-semibold uppercase truncate max-w-[65%]" title={docName}>
                  {docName}
                </span>
                {docSpec && (
                  <span className="text-xs md:text-sm text-white/80 truncate max-w-[35%]" title={docSpec}>
                    {docSpec}
                  </span>
                )}
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs md:text-sm text-white/90">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 opacity-80" />
                  {formattedWhen || <span className="text-white/60">Choose a date & time</span>}
                </span>
                {feeAmount != null && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 opacity-80" />
                    <span className="font-semibold">₹{feeAmount}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Form card */}
        <div className={cn(glassChip, 'p-4 mt-4')}>
          <div className="space-y-3">
            <Field
              id="parentName"
              label="Parent's Name"
              disabled={otpSent}
              placeholder="Your full name"
              value={localPatient.parentName}
              onChange={(newValue) => setLocalPatient({ ...localPatient, parentName: newValue })}
              error={errors.parentName}
            />
            <Field
              id="childName"
              label="Child's Name"
              disabled={otpSent}
              placeholder="Your child's name"
              value={localPatient.childName}
              onChange={(newValue) => setLocalPatient({ ...localPatient, childName: newValue })}
              error={errors.childName}
            />
            <Field
              id="email"
              label="Email"
              type="email"
              disabled={otpSent}
              placeholder="name@example.com"
              value={localPatient.email}
              onChange={(newValue) => setLocalPatient({ ...localPatient, email: newValue })}
              error={errors.email}
            />

            {/* Phone with 🇮🇳 +91 chip */}
            <div className="relative">
              <label htmlFor="phone" className="block text-xs md:text-sm text-white/80 mb-1.5">
                Phone Number
              </label>
              <div
                className={cn(
                  'rounded-xl border border-white/30 bg-white/80 text-gray-900',
                  'focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-200',
                  'flex items-center overflow-hidden',
                  errors.phone && 'border-red-500 focus-within:ring-red-200 focus-within:border-red-500'
                )}
              >
                <span className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-800 bg-gray-100/70 select-none">
                  🇮🇳 <span className="opacity-80">+91</span>
                </span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="tel"
                  disabled={otpSent}
                  placeholder="10-digit number"
                  aria-invalid={!!errors.phone}
                  className="flex-1 px-3 py-2 bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-500"
                  value={localPatient.phone}
                  onChange={(e) => {
                    const only = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setLocalPatient({ ...localPatient, phone: only });
                  }}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-300 mt-1">{errors.phone}</p>}
            </div>

            {/* Inline OTP row (reveals after Continue) */}
            <AnimatePresence initial={false}>
              {otpSent && (
                <motion.div
                  key="otp-row"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                  <label className="text-xs md:text-sm text-white/80 block mb-2">
                    Enter the {OTP_LENGTH}-digit OTP
                  </label>
                  <div className="flex justify-center gap-2 rounded-xl p-2 bg-white/10 border border-white/15">
                    {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                      <input
                        key={i}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        aria-label={`Digit ${i + 1}`}
                        className="w-10 h-12 text-lg text-center rounded-md border border-white/20 bg-white/70 text-gray-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                        ref={(el) => {
                          if (el) otpInputsRef.current[i] = el;
                        }}
                        value={otp[i] || ''}
                        onChange={(e) => handleOtpChange(i, e.target.value, e)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      />
                    ))}
                  </div>

                  {/* Resend / status */}
                  {!otpVerified && (
                    <div className="mt-2 flex items-center justify-between text-xs text-white/80">
                      {timer > 0 ? (
                        <span>Resend in 0:{timer.toString().padStart(2, '0')}</span>
                      ) : (
                        <button
                          onClick={handleResend}
                          disabled={resendCount >= MAX_RESENDS || isSendingOtp}
                          className={cn(
                            'text-teal-200 hover:text-teal-100 font-medium',
                            (resendCount >= MAX_RESENDS || isSendingOtp) && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          Resend OTP
                        </button>
                      )}
                      <span className="text-white/60">via email/SMS</span>
                    </div>
                  )}

                  {/* Verified note */}
                  <AnimatePresence>
                    {otpVerified && (
                      <motion.div
                        className="mt-2 flex items-center justify-center gap-2 text-green-300"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <p className="text-sm">OTP Verified</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {errors.meta && <p className="text-xs text-red-300">{errors.meta}</p>}
          </div>

          {/* Footer Actions */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedSlot(null);
                setStep(0);
              }}
              className="col-span-1 text-sm font-medium text-white/95 py-2 px-4 rounded-xl border border-white/25 bg-white/10 hover:bg-white/20 transition"
            >
              Go Back
            </button>

            {!otpSent ? (
              <Button
                onClick={handleContinue}
                disabled={isSendingOtp}
                className="col-span-2 rounded-xl"
              >
                {isSendingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP…
                  </>
                ) : (
                  'Continue'
                )}
              </Button>
            ) : (
              <Button
                onClick={handleVerifyOtp}
                disabled={otp.length !== OTP_LENGTH || isVerifying || isPaying}
                className="col-span-2 rounded-xl"
              >
                {isVerifying || isPaying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {isVerifying ? 'Verifying…' : 'Processing…'}
                  </>
                ) : (
                  'Verify & Pay'
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}