'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2, User, Mail, MessageSquare, Phone } from 'lucide-react';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string | undefined;

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Keep it under 50 chars'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  question: z.string().min(6, 'Please write at least 6 characters').max(500, 'Keep it under 500 chars'),
  otp: z.string().length(6, 'OTP must be 6 digits').optional(),
  website: z.string().optional(), // honeypot
});

type Step = 'form' | 'otp' | 'success';

interface Props {
  slug: string;
  blogTitle: string;
  successMessage?: string | null;
}

const MAX_RESENDS = 3;
const RESEND_COOLDOWN_BASE = 30;

export default function BlogCommentForm({ slug, blogTitle, successMessage }: Props) {
  const prefersReducedMotion = useReducedMotion();

  const [step, setStep] = useState<Step>('form');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(RESEND_COOLDOWN_BASE);
  const [resendCount, setResendCount] = useState(0);
  const [startedAt, setStartedAt] = useState<number>(Date.now());

  const recaptchaCacheRef = useRef<{ token: string; ts: number } | null>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', phone: '', question: '', otp: '', website: '' },
    mode: 'onBlur',
  });

  const { watch, setValue, getValues, trigger, formState } = form;
  const name = watch('name');
  const email = watch('email');
  const phone = watch('phone');
  const question = watch('question');
  const otp = watch('otp');

  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);
  const hasName = useMemo(() => !!name.trim(), [name]);
  const hasQuestion = useMemo(() => question.trim().length >= 6, [question]);

  /** resend countdown */
  useEffect(() => {
    if (!otpSent || timer === 0) return;
    const id = setInterval(() => setTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [otpSent, timer]);

  /** reCAPTCHA v3 utility */
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

  /** OTP send (same backend as feedback form) */
  const handleSendOtp = async () => {
    const valid = await trigger(['name', 'email', 'phone', 'question']);
    if (!valid) {
      const first = Object.values(formState.errors)[0] as { message?: string } | undefined;
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
      if (!token) {
        toast.error('reCAPTCHA not ready — try again in a moment');
        return;
      }

      // prefer email if valid; else phone
      const identifier = isEmailValid ? email.trim() : `+91${phone}`;

      const res = await fetch('/api/verify/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          channel: 'auto',
          scope: 'blog-comment', // <-- distinct scope for this flow
          recaptchaToken: token,
          honeypot: getValues('website'),
          startedAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setSessionId(data.sessionId);
      setOtpSent(true);
      setStep('otp');
      setTimer(RESEND_COOLDOWN_BASE + resendCount * 10);
      setValue('otp', '');
      setResendCount((c) => c + 1);
      toast.success('OTP sent');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
      setStartedAt(Date.now());
    }
  };

  /** Verify + Submit */
  const handleVerifyAndSubmit = async (otpCode: string) => {
    if (!sessionId || otpCode.length !== 6) {
      toast.error('Invalid OTP');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const verifyRes = await fetch('/api/verify/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, otp: otpCode }),
      });
      const verifyJson = await verifyRes.json();
      if (!verifyRes.ok || !verifyJson.ok) throw new Error(verifyJson.error || 'OTP verification failed');

      // Create the comment after verify
      setIsSubmitting(true);
      const v = getValues();
      const createRes = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          slug,
          name: v.name,
          email: v.email,
          phone: v.phone,
          question: v.question,
        }),
      });
      const createJson = await createRes.json();
      if (!createRes.ok || !createJson.ok) throw new Error(createJson.error || 'Failed to submit comment');

      setStep('success');
      toast.success('Comment submitted!');
    } catch (e: any) {
      toast.error(e?.message || 'Verification failed. Try again.');
    } finally {
      setIsVerifyingOtp(false);
      setIsSubmitting(false);
    }
  };

  /** OTP input handlers */
  const handleOtpChange = (index: number, value: string, e?: React.ChangeEvent<HTMLInputElement>) => {
    if (!/^\d?$/.test(value)) return;
    const arr = (otp || '').split('');
    arr[index] = value;
    const next = arr.join('');
    setValue('otp', next);

    if (value && index < 5) otpInputsRef.current[index + 1]?.focus();
    else if (
      !value &&
      index > 0 &&
      e?.target.selectionStart === 0 &&
      (e?.nativeEvent as any)?.inputType === 'deleteContentBackward'
    ) {
      otpInputsRef.current[index - 1]?.focus();
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

  return (
    <div className="max-sm:pb-5 max-sm:pt-5 max-w-lg">
      <Card className="border-white/20 shadow-xl bg-white/10 backdrop-blur-md rounded-3xl">
        <CardContent className="p-6">
          {/* Step: Form */}
          {step === 'form' && (
            <motion.div variants={formVariants} initial="hidden" animate="visible" exit="exit">
              <Form {...form}>
                <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSendOtp(); }} noValidate>
                  {/* Honeypot */}
                  <input type="text" {...form.register('website')} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-white/80">
                          <User className="w-4 h-4" /> Name
                        </FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input {...field} placeholder="Your Name" disabled={otpSent}
                              className="rounded-lg border-gray-200/50 bg-white/70 backdrop-blur-sm focus:border-primary focus:ring-0 transition-all" />
                          </FormControl>
                          {name && !otpSent && renderStatusIcon(hasName)}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-white/80">
                          <Mail className="w-4 h-4" /> Email
                        </FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input {...field} type="email" inputMode="email" placeholder="name@example.com" disabled={otpSent}
                              className="rounded-lg border-gray-200/50 bg-white/70 backdrop-blur-sm focus:border-primary focus:ring-0 transition-all" />
                          </FormControl>
                          {email && !otpSent && renderStatusIcon(isEmailValid)}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-white/80">
                          <Phone className="w-4 h-4" /> Phone (🇮🇳 +91)
                        </FormLabel>
                        <div className="relative flex items-center border border-gray-200/50 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-primary bg-white/70 backdrop-blur-sm">
                          <div className="flex items-center px-3 py-2 bg-gray-100/50 text-sm gap-1 shrink-0 text-gray-500">+91</div>
                          <FormControl>
                            <input
                              {...field}
                              type="tel"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              disabled={otpSent}
                              placeholder="10-digit number"
                              className="w-full px-3 py-2 bg-transparent outline-none text-sm text-gray-900"
                              onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="question"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-white/80">
                          <MessageSquare className="w-4 h-4" /> Comment / Question
                        </FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Textarea
                              {...field}
                              rows={3}
                              disabled={otpSent}
                              placeholder={`Write about: ${blogTitle}`}
                              className="rounded-lg border-gray-200/50 bg-white/70 backdrop-blur-sm focus:border-primary focus:ring-0 transition-all resize-none"
                              onChange={(e) => field.onChange(e.target.value.slice(0, 500))}
                            />
                          </FormControl>
                          {question && !otpSent && renderStatusIcon(hasQuestion)}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isSendingOtp}
                    className="w-full rounded-lg bg-primary/90 shadow-lg hover:bg-primary transition-all backdrop-blur-sm"
                  >
                    {isSendingOtp ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP…</>) : ('Submit')}
                  </Button>
                </form>
              </Form>
            </motion.div>
          )}

          {/* Step: OTP */}
          {step === 'otp' && (
            <motion.div variants={formVariants} initial="hidden" animate="visible" exit="exit">
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
                            <FormLabel className="flex items-center gap-2 text-white/80">
                              <Phone className="w-4 h-4" /> Enter OTP
                            </FormLabel>
                            <div className="text-xs">
                              {canResend ? (
                                <button type="button" onClick={handleSendOtp} className="text-primary hover:underline font-medium">
                                  Resend
                                </button>
                              ) : (
                                <span className="text-gray-400">0:{timer.toString().padStart(2, '0')}</span>
                              )}
                            </div>
                          </div>
                          <FormControl>
                            <div className="flex justify-center gap-2 rounded-xl p-2 bg-white/30">
                              {Array.from({ length: 6 }).map((_, i) => (
                                <motion.input
                                  key={i}
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={1}
                                  className="w-10 h-12 text-lg text-center rounded-md border border-gray-300 bg-white/70 focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                                  ref={(el) => { otpInputsRef.current[i] = el; }}
                                  defaultValue={otp?.[i] || ''}
                                  onChange={(e) => handleOtpChange(i, e.target.value, e as any)}
                                  disabled={isVerifyingOtp || isSubmitting}
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
                    disabled={isVerifyingOtp || isSubmitting || !otp || otp.length !== 6}
                    className={['w-full rounded-lg transition-all', isVerifyingOtp ? 'bg-primary/90 ring-2 ring-primary/40 shadow-lg' : 'bg-primary/90 hover:bg-primary'].join(' ')}
                  >
                    {isVerifyingOtp || isSubmitting ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…</>) : ('Verify & Submit')}
                  </Button>
                </form>
              </Form>
            </motion.div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <motion.div initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-900">
                {successMessage || 'Thanks! Your comment is submitted.'}
              </h3>
              <p className="text-xs text-gray-500">It will appear after moderation.</p>
              <div className="pt-2">
                <Button onClick={() => location.reload()} className="rounded-lg">Refresh</Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}