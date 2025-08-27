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
import { CheckCircle2, AlertCircle, Loader2, Mail, User, MessageSquare, Phone, Link as LinkIcon, Briefcase } from 'lucide-react';
import { Title, Subtitle } from '@/components/ui/theme/typography';

type ChannelUsed = 'email' | 'sms' | 'whatsapp' | null;

/** ---------- TUNABLES ---------- */
const MAX_RESENDS = 3;
const RESEND_COOLDOWN_BASE = 30;
const USE_BACKGROUND_SUBMIT = true;
const DRAFT_KEY = 'career_form_draft_v1';
/** ------------------------------ */

const urlRegex = /^https?:\/\/[^\s]+$/i;

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(60, 'Keep it under 60 chars'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  role: z.string().max(60).optional().or(z.literal('').transform(() => undefined)),
  message: z.string().min(6, 'Tell us a bit more (6+ chars)').max(800, 'Keep it under 800 chars'),
  resumeLink: z
    .string()
    .min(1, 'Resume link is required')
    .refine((v) => urlRegex.test(v), 'Enter a valid URL')
    .refine((v) => {
      try {
        const u = new URL(v);
        const host = u.hostname.toLowerCase();
        return [
          'drive.google.com',
          'docs.google.com',
          'storage.googleapis.com',
          'dropbox.com',
          'www.dropbox.com',
          'onedrive.live.com',
          '1drv.ms',
        ].includes(host);
      } catch { return false; }
    }, 'Use a link from Drive/Docs/Dropbox/OneDrive'),
  otp: z.string().length(6, 'OTP must be 6 digits').optional(),
  website: z.string().optional(), // honeypot
});

interface CareerFormProps {
  _type: 'career-form';
  _key: string;
  theme?: ThemeVariant | null;
  tagLine?: string | null;
  title?: string | null;
  successMessage?: string | null;
  pageSource?: string;
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

export default function CareerForm({
  theme,
  tagLine,
  title,
  successMessage,
  pageSource = 'Careers Page',
}: CareerFormProps) {
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
  const formCardRef = useRef<HTMLDivElement | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', phone: '', role: '', message: '', resumeLink: '', otp: '', website: '' },
    mode: 'onBlur',
  });

  const { watch, setValue, trigger, getValues, setError, clearErrors } = form;
  const name = watch('name');
  const email = watch('email');
  const phone = watch('phone');
  const message = watch('message');
  const resumeLink = watch('resumeLink');
  const otp = watch('otp');
  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);

  /** Draft restore/save */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        ['name', 'email', 'phone', 'role', 'message', 'resumeLink'].forEach((k) => d?.[k] && setValue(k as any, d[k], { shouldDirty: false }));
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const sub = form.watch((v) => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          name: v.name ?? '', email: v.email ?? '', phone: v.phone ?? '',
          role: v.role ?? '', message: v.message ?? '', resumeLink: v.resumeLink ?? '',
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

  /** OTP input handling (same as contact) */
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

  /** reCAPTCHA */
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

  /** Send OTP */
  const handleSendOtp = async () => {
    const valid = await trigger(['name', 'email', 'phone', 'role', 'message', 'resumeLink']);
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

      const identifier = (email || '').trim();
      const phoneId = `+91${phone}`;

      const res = await fetch('/api/verify/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier || phoneId,
          channel: 'auto',
          scope: 'careers',
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
        name: v.name,
        email: v.email,
        phone: v.phone,
        role: v.role,
        message: v.message,
        resumeLink: v.resumeLink,
        subject: `Career Application from ${pageSource}`,
      };
      const submitUrl = '/api/careers/submit';
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
    <Theme variant={theme || 'white'}>
      <div className="py-10 px-0 sm:px-6 max-w-xl mx-auto">
        {step !== 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-6">
            {tagLine && <Subtitle className="!mb-1">{tagLine}</Subtitle>}
            {title && <Title>{title}</Title>}
          </motion.div>
        )}

        <Card ref={formCardRef} className="border-none shadow-lg bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-3xl" role="region" aria-label="Careers form">
          <CardContent className="p-6 sm:p-8">
            <Stepper />

            {step === 'form' && (
              <motion.div variants={formVariants} initial="hidden" animate="visible" exit="exit" layout>
                <Form {...form}>
                  <form
                    className="space-y-4"
                    onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }}
                    noValidate
                  >
                    {/* Honeypot */}
                    <input type="text" {...form.register('website')} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

                    {/* Name */}
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
                              <Input {...field} placeholder="Your full name" autoComplete="name" disabled={otpSent} className={INPUT_BASE} />
                            </FormControl>
                            {name && !otpSent && renderStatusIcon(!!name.trim())}
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
                              <Input {...field} placeholder="name@example.com" type="email" inputMode="email" autoComplete="email" disabled={otpSent} className={INPUT_BASE} />
                            </FormControl>
                            {email && !otpSent && renderStatusIcon(isEmailValid)}
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
                            <span className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100/60 dark:bg-gray-600/50 select-none">+91</span>
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

                    {/* Role (optional) */}
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Briefcase className="w-4 h-4" /> Role (optional)
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Pediatric Nephrologist" disabled={otpSent} className={INPUT_BASE} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Message */}
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
                              placeholder="Why you’re a great fit, experience, location, availability, etc."
                              rows={4}
                              disabled={otpSent}
                              className={INPUT_BASE + ' resize-none'}
                              onChange={(e) => field.onChange(e.target.value.slice(0, 800))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Resume link */}
                    <FormField
                      control={form.control}
                      name="resumeLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <LinkIcon className="w-4 h-4" /> Resume link (Google Drive/Docs preferred)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="url"
                              inputMode="url"
                              disabled={otpSent}
                              placeholder="https://drive.google.com/file/d/…/view?usp=sharing"
                              className={INPUT_BASE}
                            />
                          </FormControl>
                          <p className="text-[11px] text-gray-300">
                            Set sharing to <strong>Anyone with the link (Viewer)</strong>
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full rounded-xl bg-primary/90 hover:bg-primary hover:scale-[1.01] active:scale-[.99] transition-all"
                    >
                      {isSendingOtp ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP…</>) : ('Submit Application')}
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
                                  <span className="text-gray-300">0:{timer.toString().padStart(2, '0')}</span>
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
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18, delay: i * 0.02 }}
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
                  {successMessage || 'Application submitted!'}
                </h3>
                <p className="text-xs text-gray-300">Thanks{name && <> <span className="font-medium">{name.split(' ')[0]}</span></>} — we’ll review and get back to you.</p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button variant="default" onClick={() => { setStep('form'); setSessionId(null); setOtpSent(false); setValue('otp', ''); }} className="rounded-xl">
                    Send another
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