'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Theme, ThemeVariant } from '@/components/ui/theme/Theme';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2, User, Star, Phone, Mail } from 'lucide-react';
import { Title, Subtitle } from '@/components/ui/theme/typography';

type ChannelUsed = 'email' | 'sms' | 'whatsapp' | null;

/** ---------- TUNABLES ---------- */
const MAX_RESENDS = 3;
const RESEND_COOLDOWN_BASE = 30;
const USE_BACKGROUND_SUBMIT = true;
const DRAFT_KEY = 'doctor_review_form_v2';
/** ------------------------------ */

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Keep it under 50 chars'),
  email: z.string().email('Enter a valid email'),
  rating: z.coerce.number().min(1, 'Rating is required').max(5, 'Max 5'),
  comment: z.string().min(6, 'Please write at least 6 characters').max(600, 'Keep it under 600 chars'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  otp: z.string().length(6, 'OTP must be 6 digits').optional(),
  website: z.string().optional(), // honeypot
});

interface ReviewFormProps {
  doctorId: string;
  theme?: ThemeVariant | null;
  tagLine?: string | null;
  title?: string | null;
  successMessage?: string | null;
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string | undefined;

// Visual bases
const INPUT_BASE =
  'w-full rounded-xl border border-gray-300/70 bg-white/60 dark:bg-gray-700/50 backdrop-blur-sm transition-all outline-none ' +
  'focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm text-gray-900 dark:text-gray-100';

const FIELD_BASE =
  'rounded-xl border border-gray-300/70 bg-white/60 dark:bg-gray-700/50 backdrop-blur-sm transition-all ' +
  'focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary ';

const OTP_BASE =
  'w-10 h-12 text-lg text-center rounded-md border border-gray-300 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm ' +
  'focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50';

export default function ReviewForm({
  doctorId,
  theme,
  tagLine,
  title,
  successMessage,
}: ReviewFormProps) {
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

  const recaptchaCacheRef = useRef<{ token: string; ts: number } | null>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', rating: 5, comment: '', phone: '', otp: '', website: '' },
    mode: 'onBlur',
  });

  const { watch, setValue, trigger, getValues, setError, clearErrors } = form;
  const name = watch('name');
  const email = watch('email');
  const rating = watch('rating');
  const comment = watch('comment');
  const phone = watch('phone');
  const otp = watch('otp');

  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);
  const hasName = useMemo(() => !!name.trim(), [name]);
  const hasComment = useMemo(() => comment.trim().length >= 6, [comment]);

  /** Draft restore/save */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        ['name', 'email', 'rating', 'comment', 'phone'].forEach((k) => d?.[k] != null && setValue(k as any, d[k], { shouldDirty: false }));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const sub = form.watch((v) => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          name: v.name ?? '', email: v.email ?? '', rating: v.rating ?? 5, comment: v.comment ?? '', phone: v.phone ?? '',
        }));
      } catch {}
    });
    return () => sub.unsubscribe();
  }, [form]);

  /** Resend countdown */
  useEffect(() => {
    if (!otpSent || isVerified || timer === 0) return;
    const id = setInterval(() => setTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [timer, otpSent, isVerified]);

  /** OTP input handling */
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

    if (newOtp.replace(/\D/g, '').length === 6 && !isVerifyingOtp && !isSubmitting) {
      setIsVerifyingOtp(true);
      handleVerifyAndSubmit(newOtp);
    }
  };
  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpInputsRef.current[index]?.value && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
      const arr = (otp || '').split(''); arr[index - 1] = ''; setValue('otp', arr.join(''));
    } else if (event.key === 'ArrowLeft' && index > 0) otpInputsRef.current[index - 1]?.focus();
    else if (event.key === 'ArrowRight' && index < 5) otpInputsRef.current[index + 1]?.focus();
  };

  /** reCAPTCHA v3 */
  const getRecaptchaToken = async (): Promise<string> => {
    try {
      const now = Date.now();
      if (recaptchaCacheRef.current && now - recaptchaCacheRef.current.ts < 30_000) return recaptchaCacheRef.current.token;
      const keyFromMeta =
        typeof document !== 'undefined' ? document.querySelector<HTMLMetaElement>('meta[name="recaptcha-site-key"]')?.content : '';
      const siteKey = RECAPTCHA_SITE_KEY || (window as any)?.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || keyFromMeta || '';
      const grecaptcha = (window as any)?.grecaptcha;
      if (!siteKey || !grecaptcha?.execute || !grecaptcha?.ready) return '';
      await new Promise<void>((resolve) => grecaptcha.ready(() => resolve()));
      const token = await grecaptcha.execute(siteKey, { action: 'submit' });
      if (token) recaptchaCacheRef.current = { token, ts: now };
      return token || '';
    } catch { return ''; }
  };

  /** Send OTP (prefer SMS, but allow email if present) */
  const handleSendOtp = async () => {
    const valid = await trigger(['name', 'email', 'rating', 'comment', 'phone']);
    if (!valid) {
      const errs = form.formState.errors;
      const first = Object.values(errs)[0] as { message?: string } | undefined;
      toast.error(first?.message || 'Fix the highlighted fields');
      return;
    }
    if (resendCount >= MAX_RESENDS) {
      toast.error(`Maximum OTP resend limit of ${MAX_RESENDS} reached`);
      return;
    }

    setIsSendingOtp(true);
    try {
      const token = await getRecaptchaToken();
      if (!token) { toast.error('reCAPTCHA not ready — try again in a moment'); return; }

      // try email first (if valid), else SMS
      const identifier = isEmailValid ? email.trim() : `+91${phone}`;

      const res = await fetch('/api/verify/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          channel: 'auto',     // let server choose email/sms
          scope: 'review',
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

      toast.success('OTP sent');
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

      const v = getValues();
      const payload = {
        sessionId,
        doctorId,
        name: v.name,
        email: v.email,
        rating: v.rating,
        comment: v.comment,
        phone: v.phone,
        
      };
      const submitUrl = '/api/reviews/submit';
      const json = JSON.stringify(payload);

      if (!USE_BACKGROUND_SUBMIT) {
        setIsSubmitting(true);
        const submitRes = await fetch(submitUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json });
        const submitJson = await submitRes.json();
        setIsSubmitting(false);
        if (!submitRes.ok) throw new Error(submitJson.error || 'Failed to submit');
      } else {
        let queued = false;
        if ('sendBeacon' in navigator) {
          try { queued = navigator.sendBeacon(submitUrl, new Blob([json], { type: 'application/json' })); } catch { queued = false; }
        }
        if (!queued) {
          fetch(submitUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: json, keepalive: true }).catch(() => {});
        }
      }

      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      setStep('success');
    } catch (err: any) {
      toast.error(err.message || 'Verification failed. Please try again.');
      setIsVerified(false);
    } finally {
      setIsVerifyingOtp(false);
      setIsSubmitting(false);
    }
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
          const state = i < idx ? 'done' : i === idx ? 'current' : 'upcoming';
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="relative flex items-center justify-center">
                {state === 'current' && (
                  <motion.span
                    className="absolute inline-block h-5 w-5 rounded-full bg-primary/30 blur-sm"
                    initial={{ opacity: 0.3, scale: 0.9 }}
                    animate={{ opacity: [0.6, 0.3, 0.6], scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    aria-hidden
                  />
                )}
                <div
                  className={[
                    'h-2.5 w-2.5 rounded-full relative z-10 transition-all',
                    state === 'done' ? 'bg-primary/90 ring-4 ring-primary/30' :
                    state === 'current' ? 'bg-primary ring-4 ring-primary/15' :
                    'bg-gray-200 dark:bg-gray-700',
                  ].join(' ')}
                />
              </div>
              <span
                className={[
                  'transition-colors',
                  state === 'done' ? 'text-primary/90 font-medium' :
                  state === 'current' ? 'text-primary font-semibold' :
                  'text-gray-300 dark:text-gray-600',
                ].join(' ')}
              >
                {label}
              </span>
              {i < 2 && <div className="w-8 h-px bg-gradient-to-r from-transparent via-gray-300/50 to-transparent dark:via-gray-600/50" />}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
      <div className="py-5 px-6 max-w-xl mx-auto">
        {step !== 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-white mb-8">
            {tagLine && <Subtitle>{tagLine}</Subtitle>}
            {title ? <Title className="text-white">{title}</Title> : <Title className="text-white">Share Your Feedback</Title>}
          </motion.div>
        )}

        <Card className="border-none shadow-lg bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-3xl">
          <CardContent className="p-6 sm:p-8">
            <Stepper />

            {step === 'form' && (
              <motion.div variants={formVariants} initial="hidden" animate="visible" exit="exit" layout>
                <Form {...form}>
                  <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} noValidate>
                    {/* Honeypot */}
                    <input type="text" {...form.register('website')} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

                    {/* Name */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <User className="w-4 h-4" /> Your Name
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input {...field} placeholder="Your name" disabled={otpSent} className={INPUT_BASE} />
                            </FormControl>
                            {name && !otpSent && renderStatusIcon(hasName)}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Email */}
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
                              <Input {...field} type="email" inputMode="email" placeholder="name@example.com" disabled={otpSent} className={INPUT_BASE} />
                            </FormControl>
                            {email && !otpSent && renderStatusIcon(isEmailValid)}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Rating */}
                    <FormField
                      control={form.control}
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Star className="w-4 h-4" /> Rating
                          </FormLabel>
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map((n) => (
                              <button
                                key={n}
                                type="button"
                                className="transition-transform hover:scale-110 disabled:opacity-50"
                                disabled={otpSent}
                                onClick={() => field.onChange(n)}
                                aria-label={`Rate ${n}`}
                              >
                                <Star
                                  className={`h-6 w-6 stroke-2 ${
                                    n <= rating ? 'fill-yellow-400 stroke-yellow-500' : 'fill-transparent stroke-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Comment */}
                    <FormField
                      control={form.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <CheckCircle2 className="w-4 h-4" /> Comment
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={4}
                                disabled={otpSent}
                                placeholder="Write your feedback…"
                                className={INPUT_BASE + ' resize-none'}
                                onChange={(e) => field.onChange(e.target.value.slice(0, 600))}
                              />
                            </FormControl>
                            {comment && !otpSent && renderStatusIcon(hasComment)}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Phone */}
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Phone className="w-4 h-4" /> Phone (🇮🇳 +91)
                          </FormLabel>
                          <div className={FIELD_BASE + 'flex items-center overflow-hidden'}>
                            <span className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100/60 dark:bg-gray-600/50 select-none">
                              +91
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
                                className="flex-1 px-3 py-2 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100"
                                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isSendingOtp} className="w-full rounded-xl bg-primary/90 hover:bg-primary hover:scale-[1.01] active:scale-[.99] transition-all backdrop-blur-sm">
                      {isSendingOtp ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP…</>) : ('Submit Feedback')}
                    </Button>
                  </form>
                </Form>
              </motion.div>
            )}

            {/* OTP step */}
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
                              <div className="text-xs">
                                {canResend ? (
                                  <button type="button" onClick={handleSendOtp} className="text-primary hover:underline font-medium">
                                    Resend OTP
                                  </button>
                                ) : (
                                  <span className="text-gray-400">0:{timer.toString().padStart(2, '0')}</span>
                                )}
                              </div>
                            </div>
                            <FormControl>
                              <div className="flex justify-center gap-2 rounded-xl p-2" aria-label="One-time password inputs">
                                {Array.from({ length: 6 }).map((_, i) => (
                                  <motion.input
                                    key={i}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
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
                    <Button
                      type="button"
                      onClick={() => otp && otp.length === 6 && handleVerifyAndSubmit(otp)}
                      disabled={isVerifyingOtp || isSubmitting || !otp || otp.length !== 6 || isVerified}
                      className={['w-full rounded-xl transition-all', isVerifyingOtp ? 'bg-primary/90 ring-2 ring-primary/40 shadow-lg' : 'bg-primary/90 hover:bg-primary'].join(' ')}
                    >
                      {isVerifyingOtp || isSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…</>) : ('Verify now')}
                    </Button>
                  </form>
                </Form>
              </motion.div>
            )}

            {/* Success */}
            {step === 'success' && (
              <motion.div initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6" layout>
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {successMessage || 'Review submitted!'}
                </h3>
                <p className="text-xs text-gray-500">Thanks{name && <> <span className="font-medium">{name.split(' ')[0]}</span></>} — your review will appear once approved.</p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button variant="default" onClick={() => { location.reload(); }} className="rounded-xl">
                    Refresh
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}