'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Theme, ThemeVariant } from '@/components/ui/theme/Theme';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2, Mail, User, MessageSquare, Phone } from 'lucide-react';
import { Title, Subtitle } from '@/components/ui/theme/typography';

type ChannelUsed = 'email' | 'sms' | 'whatsapp' | null;

/** ---------- TUNABLES ---------- */
const MAX_RESENDS = 3;
const RESEND_COOLDOWN_BASE = 30;
const USE_BACKGROUND_SUBMIT = true;
const DRAFT_KEY = 'contact_form_draft_v2';
/** ------------------------------ */

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  message: z.string().min(6, 'Message must be at least 6 characters').max(500, 'Message must be less than 500 characters'),
  otp: z.string().length(6, 'OTP must be 6 digits').optional(),
  website: z.string().optional(), // honeypot
});

interface ContactFormProps {
  _type: 'contact-form';
  _key: string;
  theme?: ThemeVariant | null;
  tagLine?: string | null;
  title?: string | null;
  successMessage?: string | null;
  pageSource?: string;
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string | undefined;

// Unified field visuals
const INPUT_BASE =
  'w-full rounded-xl border border-gray-300/70 bg-white/60 dark:bg-gray-700/50 ' +
  'backdrop-blur-sm transition-all outline-none ' +
  'focus:border-primary focus:ring-2 focus:ring-primary/20 ' +
  'text-sm text-gray-900 dark:text-gray-100';

const FIELD_BASE =
  'rounded-xl border border-gray-300/70 bg-white/60 dark:bg-gray-700/50 ' +
  'backdrop-blur-sm transition-all ' +
  'focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary ';

const OTP_BASE =
  'w-10 h-12 text-lg text-center rounded-md border border-gray-300 ' +
  'bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm ' +
  'focus:border-primary focus:ring-2 focus:ring-primary/20 ' +
  'disabled:opacity-50';

export default function ContactForm({
  theme,
  tagLine,
  title,
  successMessage,
  pageSource = 'Contact Page',
}: ContactFormProps) {
  const prefersReducedMotion = useReducedMotion();

  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [isVerified, setIsVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(RESEND_COOLDOWN_BASE);
  const [resendCount, setResendCount] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [channelUsed, setChannelUsed] = useState<ChannelUsed>(null);
  const [startedAt, setStartedAt] = useState<number>(Date.now());
  const [pulseRow, setPulseRow] = useState(false); // raised/glow/bounce after 6 digits

  const recaptchaCacheRef = useRef<{ token: string; ts: number } | null>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const formCardRef = useRef<HTMLDivElement | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', phone: '', message: '', otp: '', website: '' },
    mode: 'onBlur',
  });

  const { watch, setValue, trigger, getValues, setError, clearErrors } = form;
  const name = watch('name');
  const email = watch('email');
  const phone = watch('phone');
  const message = watch('message');
  const otp = watch('otp');

  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);

  /** Draft restore/save */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        ['name', 'email', 'phone', 'message'].forEach((k) => d?.[k] && setValue(k as any, d[k], { shouldDirty: false }));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const sub = form.watch((v) => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          name: v.name ?? '', email: v.email ?? '', phone: v.phone ?? '', message: v.message ?? '',
        }));
      } catch {}
    });
    return () => sub.unsubscribe();
  }, [form]);

  /** Resend countdown (no progress bar, just timer text) */
  useEffect(() => {
    if (!otpSent || isVerified || timer === 0) return;
    const id = setInterval(() => setTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [timer, otpSent, isVerified]);

  /** OTP interactions */
  const handleOtpChange = (index: number, value: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (!/^\d?$/.test(value)) return;
    const arr = (otp || '').split('');
    arr[index] = value;
    const newOtp = arr.join('');
    setValue('otp', newOtp);
    clearErrors('otp');

    if (value && index < 5) otpInputsRef.current[index + 1]?.focus();
    else if (!value && index > 0 && event.target.selectionStart === 0 && (event.nativeEvent as InputEvent)?.inputType === 'deleteContentBackward') {
      otpInputsRef.current[index - 1]?.focus();
    }

    const digits = newOtp.replace(/\D/g, '').length;
    if (digits === 6 && !isVerifyingOtp && !isSubmitting) {
      // trigger visual bounce/raise
      if (!prefersReducedMotion) {
        setPulseRow(true);
        setTimeout(() => setPulseRow(false), 260);
      }
      // flip button into verifying state & auto submit
      setIsVerifyingOtp(true);
      handleVerifyAndSubmit(newOtp);
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpInputsRef.current[index]?.value && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
      const arr = (otp || '').split('');
      arr[index - 1] = '';
      setValue('otp', arr.join(''));
    } else if (event.key === 'ArrowLeft' && index > 0) otpInputsRef.current[index - 1]?.focus();
    else if (event.key === 'ArrowRight' && index < 5) otpInputsRef.current[index + 1]?.focus();
  };

  // paste handler on OTP wrapper <div>
  const handleOtpPaste: React.ClipboardEventHandler<HTMLDivElement> = (e) => {
    const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      e.preventDefault();
      setValue('otp', pasted, { shouldDirty: true });
      pasted.split('').forEach((ch, i) => {
        if (otpInputsRef.current[i]) otpInputsRef.current[i]!.value = ch;
      });
      if (!prefersReducedMotion) {
        setPulseRow(true);
        setTimeout(() => setPulseRow(false), 260);
      }
      setIsVerifyingOtp(true);
      handleVerifyAndSubmit(pasted);
    }
  };

  /** reCAPTCHA */
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

  /** Send OTP */
  const handleSendOtp = async () => {
    const valid = await trigger(['name', 'email', 'phone', 'message']);
    if (!valid) {
      const errs = form.formState.errors;
      const first = Object.values(errs)[0] as { message?: string } | undefined;
      toast.error(first?.message || 'Fix the highlighted fields');
      formCardRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
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

      const identifier = (email || '').trim();
      const phoneId = `+91${phone}`;

      const res = await fetch('/api/verify/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier || phoneId,
          channel: 'auto',
          scope: 'contact',
          recaptchaToken: token,
          honeypot: getValues('website'),
          startedAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setSessionId(data.sessionId);
      setChannelUsed((data.channelUsed as ChannelUsed) ?? null);
      setOtpSent(true);
      setStep('otp');
      setTimer(RESEND_COOLDOWN_BASE + resendCount * 10);
      setValue('otp', '');
      setResendCount((c) => c + 1);

      // 🔔 minimal toast (moved from inline), nothing else noisy
      toast.success(
        <span className="flex items-center gap-2">
          <span>OTP Sent</span>
        </span>
      );
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
      setStartedAt(Date.now());
    }
  };

  /** Verify & Submit */
  const handleVerifyAndSubmit = async (otpCode: string) => {
    if (!sessionId || otpCode.length !== 6) {
      setError('otp', { message: 'Invalid OTP' });
      toast.error('Invalid OTP');
      setIsVerifyingOtp(false);
      return;
    }
    try {
      const verifyRes = await fetch('/api/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, otp: otpCode }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok || !verifyJson.ok) throw new Error(verifyJson.error || 'OTP verification failed');

      setIsVerified(true);

      const formData = getValues();
      const payload = {
        sessionId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        subject: `Contact Form Submission from ${pageSource}`,
      };
      const submitUrl = '/api/contact/submit';
      const json = JSON.stringify(payload);

      if (!USE_BACKGROUND_SUBMIT) {
        setIsSubmitting(true);
        const submitRes = await fetch(submitUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: json,
        });
        const submitJson = await submitRes.json();
        setIsSubmitting(false);
        if (!submitRes.ok) throw new Error(submitJson.error || 'Failed to submit');
      } else {
        let queued = false;
        if ('sendBeacon' in navigator) {
          try {
            const blob = new Blob([json], { type: 'application/json' });
            queued = navigator.sendBeacon(submitUrl, blob);
          } catch {
            queued = false;
          }
        }
        if (!queued) {
          fetch(submitUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: json,
            keepalive: true,
          }).catch(() => {});
        }
      }

      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      setStep('success');
    } catch (err: any) {
      // If auto verification/submission fails, allow manual retry via button
      toast.error(err.message || 'Verification failed. Please try again.');
      setIsVerified(false);
    } finally {
      setIsVerifyingOtp(false);
      setIsSubmitting(false);
    }
  };

  const resetFlow = () => {
    setOtpSent(false);
    setValue('otp', '');
    setSessionId(null);
    setIsVerified(false);
    setTimer(RESEND_COOLDOWN_BASE);
    setResendCount(0);
    setChannelUsed(null);
    setStep('form');
    setStartedAt(Date.now());
    setPulseRow(false);
  };

  const renderStatusIcon = (valid: boolean) => (
    <span aria-hidden className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none">
      {valid ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
    </span>
  );

  const formVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0, transition: { duration: prefersReducedMotion ? 0 : 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: prefersReducedMotion ? 0 : -20, transition: { duration: prefersReducedMotion ? 0 : 0.3, ease: 'easeIn' } },
  } as const;

  const Stepper = () => (
    <div className="mb-6" aria-label="Form progress">
      <div className="flex items-center justify-center gap-3 text-xs">
        {['Details', 'Verify', 'Done'].map((label, i) => {
          const idx = (['form', 'otp', 'success'] as const).indexOf(step);
          const active = i <= idx;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={['h-2.5 w-2.5 rounded-full transition-all', active ? 'bg-primary ring-4 ring-primary/15' : 'bg-gray-300 dark:bg-gray-600'].join(' ')} />
              <span className={active ? 'text-primary/90' : 'text-gray-300'}>{label}</span>
              {i < 2 && <div className="w-8 h-px bg-gradient-to-r from-transparent via-gray-300/70 to-transparent dark:via-gray-600/70" />}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Theme variant={theme || 'white'}>
      <div className="py-10 px-0 sm:px-6 max-w-xl mx-auto">
        {step !== 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-6">
            {tagLine && <Subtitle className="!mb-1">{tagLine}</Subtitle>}
            {title && <Title>{title}</Title>}
          </motion.div>
        )}

        <Card ref={formCardRef} className="border-none shadow-lg bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-3xl" role="region" aria-label="Contact form">
          <CardContent className="p-6 sm:p-8">
            <Stepper />

            {/* ───────────────── FORM STEP ───────────────── */}
            {step === 'form' && (
              <motion.div variants={formVariants} initial="hidden" animate="visible" exit="exit" layout>
                <Form {...form}>
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendOtp();
                    }}
                    noValidate
                  >
                    {/* Honeypot */}
                    <input
                      type="text"
                      {...form.register('website')}
                      className="hidden"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                    />

                    {/* NAME */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <User className="w-4 h-4" /> Name
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Your full name"
                                autoComplete="name"
                                disabled={otpSent}
                                aria-invalid={!!form.formState.errors.name}
                                className={INPUT_BASE}
                              />
                            </FormControl>
                            {name && !otpSent && renderStatusIcon(!!name.trim())}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* EMAIL */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Mail className="w-4 h-4" /> Email
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="name@example.com"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                disabled={otpSent}
                                aria-invalid={!!form.formState.errors.email}
                                className={INPUT_BASE}
                              />
                            </FormControl>
                            {email && !otpSent && renderStatusIcon(isEmailValid)}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* PHONE (inline beside +91) */}
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Phone className="w-4 h-4" /> Phone Number
                          </FormLabel>
                          <div className={FIELD_BASE + 'flex items-center overflow-hidden'}>
                            <span className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100/60 dark:bg-gray-600/50 select-none">
                              🇮🇳 +91
                            </span>
                            <FormControl>
                              <input
                                {...field}
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="tel"
                                disabled={otpSent}
                                placeholder="10-digit number"
                                aria-invalid={!!form.formState.errors.phone}
                                className="flex-1 px-3 py-2 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100"
                                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                              />
                            </FormControl>
                            {otpSent && (
                              <Button type="button" variant="ghost" size="sm" onClick={resetFlow} className="rounded-lg mr-2">
                                Edit
                              </Button>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* MESSAGE */}
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <MessageSquare className="w-4 h-4" /> Message
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="What can we help you with?"
                              rows={4}
                              autoComplete="off"
                              disabled={otpSent}
                              aria-invalid={!!form.formState.errors.message}
                              className={INPUT_BASE + ' resize-none'}
                              onChange={(e) => {
                                const v = e.target.value.slice(0, 500);
                                field.onChange(v);
                              }}
                              onKeyDown={(e) => {
                                if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'enter') {
                                  e.preventDefault();
                                  handleSendOtp();
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full rounded-xl bg-primary/90 hover:bg-primary hover:scale-[1.01] active:scale-[.99] transition-all backdrop-blur-sm"
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP…
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </Button>
                  </form>
                </Form>
              </motion.div>
            )}

            {/* ───────────────── OTP STEP ───────────────── */}
            {step === 'otp' && (
            <motion.div variants={formVariants} initial="hidden" animate={{ opacity: 1, y: 0 }} exit="exit" layout>
              <Form {...form}>
                <form className="space-y-4">
                  <FormField
                    control={form.control}
                    name="otp"
                    render={() => {
                      const canResend = timer === 0 && !isSendingOtp;
                      return (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                              <Phone className="w-4 h-4" /> Enter OTP
                            </FormLabel>

                            {/* Timer → Resend button */}
                            <div className="text-xs">
                              {canResend ? (
                                <button
                                  type="button"
                                  onClick={handleSendOtp}
                                  className="text-primary hover:underline font-medium"
                                >
                                  Resend OTP
                                </button>
                              ) : (
                                <span className="text-gray-300">0:{timer.toString().padStart(2, '0')}</span>
                              )}
                            </div>
                          </div>

                          <FormControl>
                            <div
                              id="otp-row"
                              className="flex justify-center gap-2 rounded-xl p-2"
                              aria-label="One-time password inputs"
                              onPaste={handleOtpPaste}
                            >
                              {Array.from({ length: 6 }).map((_, i) => (
                                <motion.input
                                  key={i}
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={1}
                                  aria-label={`Digit ${i + 1}`}
                                  className={OTP_BASE}
                                  ref={(el) => { otpInputsRef.current[i] = el; }}
                                  defaultValue={otp?.[i] || ''}
                                  onChange={(e) => handleOtpChange(i, e.target.value, e as any)}
                                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                  disabled={isVerifyingOtp || isVerified}
                                  readOnly={isVerified}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 0.18, delay: i * 0.02 }}
                                />
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  {/* full-width button */}
                  <Button
                    type="button"
                    onClick={() => otp && otp.length === 6 && handleVerifyAndSubmit(otp)}
                    disabled={isVerifyingOtp || isSubmitting || !otp || otp.length !== 6 || isVerified}
                    className={[
                      'w-full rounded-xl transition-all',
                      isVerifyingOtp
                        ? 'bg-primary/90 ring-2 ring-primary/40 shadow-lg'
                        : 'bg-primary/90 hover:bg-primary',
                    ].join(' ')}
                  >
                    {isVerifyingOtp || isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…
                      </>
                    ) : (
                      'Verify now'
                    )}
                  </Button>
                </form>
              </Form>
            </motion.div>
          )}

            {/* ───────────────── SUCCESS STEP (animated, simple) ───────────────── */}
            {step === 'success' && (
              <motion.div
                variants={formVariants}
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center space-y-6"
                layout
              >
                {/* Animated checkmark */}
                <motion.svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 52 52"
                  className="w-20 h-20 mx-auto"
                  initial="hidden"
                  animate="visible"
                >
                  <motion.circle
                    cx="26"
                    cy="26"
                    r="25"
                    fill="green"
                    stroke="green"
                    strokeWidth="2"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                  />
                  <motion.path
                    fill="none"
                    stroke="white"   // ✅ white check mark
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 27l7 7 17-17"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.6, ease: 'easeInOut' }}
                  />
                </motion.svg>

                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {successMessage || 'Message sent!'}
                  </h3>
                  <p className="text-sm text-gray-300">
                    Thanks
                    {name && (
                      <>
                        , <span className="text-gray-300 font-medium">{name.split(' ')[0]}</span>
                      </>
                    )}
                  </p>
                  <p className="text-sm text-gray-300">We’ll be in touch shortly.</p>
                </div>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button variant="default" onClick={resetFlow} className="rounded-xl">
                    Send another message
                  </Button>
                  <Button
                    variant="ghost"
                    className="rounded-xl"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
                      }
                    }}
                  >
                    Close
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </Theme>
  );
}