'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Theme, ThemeVariant } from '@/components/ui/theme/Theme';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2, Mail, User, MessageSquare, Phone } from 'lucide-react';
import { Title, Subtitle } from '@/components/ui/theme/typography';

const MAX_RESENDS = 3;
const RESEND_COOLDOWN_BASE = 30;

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

type ChannelUsed = 'email' | 'sms' | 'whatsapp' | null;

/**
 * IMPORTANT: Read the reCAPTCHA site key at module scope so Next.js replaces it
 * with a string *at build time*. This avoids referencing `process` at runtime.
 * If you rotate keys at runtime, also add a <meta name="recaptcha-site-key" content="..."> in layout.tsx.
 */
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY as string | undefined;

export default function ContactForm({
  theme,
  tagLine,
  title,
  successMessage,
  pageSource = 'Contact Page',
}: ContactFormProps) {
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

  // Cache reCAPTCHA token briefly to avoid rapid re-generation
  const recaptchaCacheRef = useRef<{ token: string; ts: number } | null>(null);

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
      otp: '',
      website: '',
    },
  });

  const { watch, setValue, trigger } = form;
  const name = watch('name');
  const email = watch('email');
  const phone = watch('phone');
  const otp = watch('otp');
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    if (!otpSent || isVerified || timer === 0) return;
    const interval = setInterval(() => setTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(interval);
  }, [timer, otpSent, isVerified]);

  const handleOtpChange = (index: number, value: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (!/^\d?$/.test(value)) return;
    const arr = (otp || '').split('');
    arr[index] = value;
    const newOtp = arr.join('');
    setValue('otp', newOtp);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    } else if (!value && index > 0 && event.target.selectionStart === 0 && (event.nativeEvent as InputEvent).inputType === 'deleteContentBackward') {
      otpInputsRef.current[index - 1]?.focus();
    }

    if (newOtp.length === 6 && !isVerifyingOtp && !isSubmitting) {
      handleVerifyAndSubmit(newOtp);
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpInputsRef.current[index]?.value && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
      const arr = (otp || '').split('');
      arr[index - 1] = '';
      setValue('otp', arr.join(''));
    } else if (event.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (event.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  /**
   * Get a v3 token. We try build-time key, then window-injected global, then a <meta> tag.
   * No `process.env` reads at runtime.
   */
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

      const siteKey =
        RECAPTCHA_SITE_KEY ||
        (typeof window !== 'undefined' ? (window as any).NEXT_PUBLIC_RECAPTCHA_SITE_KEY : '') ||
        keyFromMeta ||
        '';

      const grecaptcha = (window as any)?.grecaptcha;

      if (!siteKey || !grecaptcha || typeof grecaptcha.execute !== 'function' || typeof grecaptcha.ready !== 'function') {
        console.warn('reCAPTCHA not ready');
        return '';
      }

      await new Promise<void>((resolve) => grecaptcha.ready(() => resolve()));
      const token = await grecaptcha.execute(siteKey, { action: 'submit' });
      if (token) {
        recaptchaCacheRef.current = { token, ts: now };
      }
      return token || '';
    } catch (e) {
      console.warn('reCAPTCHA: token generation failed', e);
      return '';
    }
  };

  const handleSendOtp = async () => {
    if (resendCount >= MAX_RESENDS) {
      toast.error(`Maximum OTP resend limit of ${MAX_RESENDS} reached`);
      return;
    }

    const isValid = await trigger(['name', 'email', 'phone', 'message']);
    if (!isValid) {
      const errors = form.formState.errors as any;
      const firstError = Object.values(errors)[0];
      toast.error(
        typeof firstError === 'object' && firstError && 'message' in firstError
          ? (firstError as { message?: string }).message
          : 'Please fill all fields correctly'
      );
      return;
    }

    setIsSendingOtp(true);
    try {
      const token = await getRecaptchaToken();
      if (!token) {
        toast.error('reCAPTCHA not ready — please wait 1–2 seconds and try again.');
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
          honeypot: form.getValues('website'),
          startedAt: startedAt,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');

      setSessionId(data.sessionId);
      setChannelUsed((data.channelUsed as ChannelUsed) ?? null);
      setOtpSent(true);
      setStep('otp');
      const nextCooldown = RESEND_COOLDOWN_BASE + resendCount * 10;
      setTimer(nextCooldown);
      setValue('otp', '');
      setResendCount((c) => c + 1);

      const dest =
        data.channelUsed === 'email'
          ? email
          : data.channelUsed === 'sms' || data.channelUsed === 'whatsapp'
          ? `+91${phone}`
          : (email || `+91${phone}`);

      toast.success(data.queued ? `OTP is being sent to ${dest}` : `OTP sent to ${dest}`);
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      const msg =
        error?.message === 'recaptcha_failed'
          ? 'reCAPTCHA verification failed'
          : error?.message === 'RATE_LIMITED'
          ? 'Too many attempts. Please try later.'
          : error?.message || 'Failed to send OTP';
      toast.error(msg);
    } finally {
      setIsSendingOtp(false);
      setStartedAt(Date.now());
    }
  };

  const handleVerifyAndSubmit = async (otpCode: string) => {
    if (!sessionId || !otpCode || otpCode.length !== 6) {
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

      setIsVerified(true);
      toast.success('Verified');

      // Optimistic success
      setStep('success');

      const formData = form.getValues();
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

      let queued = false;
      if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
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
        }).catch((e) => {
          console.error('Background submit failed:', e);
          toast.message('We’re delivering your message…', {
            description: 'If this persists, please try again.',
          });
        });
      } else {
        toast.message('We’re delivering your message…', {
          description: 'You can close this page anytime.',
        });
      }
    } catch (err: any) {
      console.error('Error in verify/submit:', err);
      toast.error(err.message || 'Failed to verify or submit');
      setIsVerified(false);
    } finally {
      setIsVerifyingOtp(false);
      setIsSubmitting(false);
    }
  };

  const resetPhone = () => {
    setOtpSent(false);
    setValue('otp', '');
    setSessionId(null);
    setIsVerified(false);
    setTimer(RESEND_COOLDOWN_BASE);
    setChannelUsed(null);
    setStep('form');
    setStartedAt(Date.now());
  };

  const renderStatusIcon = (valid: boolean) => (
    <span className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
      {valid ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
    </span>
  );

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
  } as const;

  return (
    <Theme variant={theme || 'white'}>
      <div className="py-10 max-w-lg mx-auto">
        {step !== 'success' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-8">
            {tagLine && <Subtitle>{tagLine}</Subtitle>}
            {title && <Title>{title}</Title>}
          </motion.div>
        )}
        <Card className="border-none shadow-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-3xl">
          <CardContent className="p-6">
            {step === 'form' && (
              <motion.div variants={formVariants} initial="hidden" animate="visible" exit="exit">
                <Form {...form}>
                  <form
                    className="space-y-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendOtp();
                    }}
                  >
                    {/* Honeypot */}
                    <input type="text" {...form.register('website')} className="hidden" tabIndex={-1} autoComplete="off" />

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
                                placeholder="Your Name"
                                disabled={otpSent}
                                className="rounded-lg border-gray-200/50 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:border-primary focus:ring-0 transition-all"
                              />
                            </FormControl>
                            {name && !otpSent && renderStatusIcon(!!name.trim())}
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
                          <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Mail className="w-4 h-4" /> Email
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Your Email"
                                type="email"
                                disabled={otpSent}
                                className="rounded-lg border-gray-200/50 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:border-primary focus:ring-0 transition-all"
                              />
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
                          <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Phone className="w-4 h-4" /> Phone Number
                          </FormLabel>
                          <div className="relative flex items-center border border-gray-200/50 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-primary bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm">
                            <div className="flex items-center px-3 py-2 bg-gray-100/50 dark:bg-gray-600/50 text-sm gap-1 shrink-0 text-gray-700 dark:text-gray-300">
                              🇮🇳 +91
                            </div>
                            <FormControl>
                              <input
                                {...field}
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                disabled={otpSent}
                                placeholder="Enter 10-digit mobile number"
                                className="w-full px-3 py-2 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100"
                                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                              />
                            </FormControl>
                            {otpSent && (
                              <Button type="button" variant="ghost" size="sm" onClick={resetPhone} className="rounded-lg">
                                Edit
                              </Button>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                              placeholder="Your Message"
                              rows={4}
                              disabled={otpSent}
                              className="rounded-lg border-gray-200/50 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:border-primary focus:ring-0 transition-all resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full rounded-lg bg-primary/90 hover:bg-primary hover:scale-105 transition-all backdrop-blur-sm"
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP...
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </Button>
                  </form>
                </Form>
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div variants={formVariants} initial="hidden" animate="visible" exit="exit">
                <Form {...form}>
                  <form className="space-y-4">
                    <FormField
                      control={form.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Phone className="w-4 h-4" /> Enter OTP
                          </FormLabel>
                          <p className="text-sm text-muted-foreground mb-2">
                            OTP sent to{' '}
                            <span className="font-semibold">
                              {channelUsed === 'email' ? email : `+91${phone}`}
                            </span>
                            {channelUsed === null && ' (sending…)'}
                          </p>
                          <FormControl>
                            <div className="flex justify-center gap-2">
                              {Array.from({ length: 6 }).map((_, i) => (
                                <motion.input
                                  key={i}
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={1}
                                  className="w-10 h-12 text-lg text-center border border-gray-300 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm disabled:opacity-50"
                                  ref={(el) => {
                                    otpInputsRef.current[i] = el;
                                  }}
                                  value={otp?.[i] || ''}
                                  onChange={(e) => handleOtpChange(i, e.target.value, e)}
                                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                  disabled={isVerifyingOtp || isVerified}
                                  initial={{ scale: 0.8, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  transition={{ duration: 0.3, delay: i * 0.1 }}
                                />
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Resend in 0:{timer.toString().padStart(2, '0')}</span>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={timer > 0 || isSendingOtp}
                        className={timer > 0 ? 'opacity-50 cursor-not-allowed text-primary' : 'text-primary'}
                      >
                        Resend OTP
                      </button>
                    </div>
                    {!isVerified && (
                      <Button
                        type="button"
                        onClick={() => otp && handleVerifyAndSubmit(otp)}
                        disabled={isVerifyingOtp || isSubmitting || !otp || otp.length !== 6}
                        className="w-full rounded-lg bg-primary/90 hover:bg-primary transition-all backdrop-blur-sm"
                      >
                        {isVerifyingOtp || isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {isVerifyingOtp ? 'Verifying...' : 'Submitting...'}
                          </>
                        ) : (
                          'Verify & Send'
                        )}
                      </Button>
                    )}
                  </form>
                </Form>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div variants={formVariants} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {successMessage || 'Message Sent Successfully!'}
                </h3>
                <p className="text-xs text-muted-foreground mt-2">
                  We’ve received your message. You can close this page — a confirmation is on its way.
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </Theme>
  );
}