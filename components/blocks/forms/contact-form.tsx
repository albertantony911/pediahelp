'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
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
import { CheckCircle2, Loader2, Mail, User, MessageSquare, Phone } from 'lucide-react';
import { Title, Subtitle } from '@/components/ui/theme/typography';

const config = {
  TIMER_DURATION: 30,
  OTP_LENGTH: 6,
  PHONE_LENGTH: 10,
  MAX_OTP_ATTEMPTS: 3,
  RATE_LIMIT_WINDOW: 60 * 1000, // 1 minute
};

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  message: z.string().min(6, 'Message must be at least 6 characters').max(500, 'Message must be less than 500 characters'),
  otp: z.string().length(config.OTP_LENGTH, 'OTP must be 6 digits').optional(),
});

interface ContactFormProps {
  theme?: ThemeVariant | null;
  tagLine?: string;
  title?: string;
  successMessage?: string;
  pageSource?: string;
  countryCode?: string;
}

export default function ContactForm({
  theme = null,
  tagLine,
  title,
  successMessage = 'Message Sent Successfully!',
  pageSource = 'Contact Page',
  countryCode = '+91',
}: ContactFormProps) {
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(config.TIMER_DURATION);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const lastAttemptRef = useRef(0);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const firstFocusRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: '',
      otp: '',
    },
  });

  const { watch, setValue, getValues, reset, trigger } = form;
  const { phone, otp } = watch();

  const initializeRecaptcha = useCallback(async () => {
    if (typeof window === 'undefined' || recaptchaRef.current) return true;
    try {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      return true;
    } catch (error) {
      console.error('Recaptcha initialization failed:', error);
      return false;
    }
  }, []);

  const clearRecaptcha = useCallback(() => {
    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
    }
  }, []);

  useEffect(() => {
    initializeRecaptcha();
    return () => clearRecaptcha();
  }, [initializeRecaptcha, clearRecaptcha]);

  useEffect(() => {
    if (step !== 'otp' || timer === 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      toast.error('An unexpected error occurred. Please try again.');
      console.error('Unhandled rejection:', event.reason);
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = (otp || '').split('');
    newOtp[index] = value;
    setValue('otp', newOtp.join(''), { shouldValidate: true });
    if (value && index < config.OTP_LENGTH - 1) otpInputsRef.current[index + 1]?.focus();
    else if (!value && index > 0) otpInputsRef.current[index - 1]?.focus();
  }, [otp, setValue]);

  const handleOtpRef = useCallback((index: number) => (el: HTMLInputElement | null) => {
    otpInputsRef.current[index] = el;
  }, []);

  const sendOtp = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const now = Date.now();
      if (now - lastAttemptRef.current < config.RATE_LIMIT_WINDOW) {
        setAttemptCount((prev) => prev + 1);
        if (attemptCount >= config.MAX_OTP_ATTEMPTS) {
          throw new Error('Too many attempts. Please wait a minute.');
        }
      } else {
        setAttemptCount(1);
      }
      lastAttemptRef.current = now;

      const isValid = await trigger(['name', 'email', 'phone', 'message']);
      if (!isValid) {
        throw new Error(Object.values(form.formState.errors)[0]?.message || 'Please fill all fields correctly');
      }

      const recaptchaSuccess = await initializeRecaptcha();
      if (!recaptchaSuccess || !recaptchaRef.current) {
        throw new Error('Security verification failed. Please check your privacy settings.');
      }

      const result = await signInWithPhoneNumber(auth, `${countryCode}${phone}`, recaptchaRef.current);
      setConfirmationResult(result);
      setStep('otp');
      setTimer(config.TIMER_DURATION);
      toast.success(`OTP sent to ${countryCode}${phone}`);
      if (firstFocusRef.current) firstFocusRef.current.focus();
    } catch (error: any) {
      const errorMessage = error.code === 'auth/invalid-phone-number'
        ? 'Invalid phone number format.'
        : error.code === 'auth/too-many-requests'
        ? 'Too many attempts. Please try again later.'
        : error.message || 'Failed to send OTP';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, attemptCount, countryCode, phone, trigger, initializeRecaptcha]);

  const verifyAndSubmit = useCallback(async () => {
    if (!confirmationResult || !otp || otp.length !== config.OTP_LENGTH || isLoading) return;
    setIsLoading(true);
    try {
      await confirmationResult.confirm(otp);
      const formData = getValues();
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, phone: `${countryCode}${phone}`, subject: `Contact Form Submission from ${pageSource}` }),
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error('Failed to submit form');
      setStep('success');
      toast.success(successMessage);
      reset();
      clearRecaptcha();
    } catch (error: any) {
      const errorMessage = error.code === 'auth/invalid-verification-code'
        ? 'Invalid OTP. Please try again.'
        : error.code === 'auth/expired-verification-code'
        ? 'OTP has expired. Please request a new one.'
        : error.message || 'Verification or submission failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [confirmationResult, otp, isLoading, getValues, countryCode, pageSource, successMessage, reset, clearRecaptcha]);

  const resetForm = useCallback(() => {
    reset();
    setStep('form');
    setConfirmationResult(null);
    setTimer(config.TIMER_DURATION);
    setAttemptCount(0);
    lastAttemptRef.current = 0;
    clearRecaptcha();
    if (firstFocusRef.current) firstFocusRef.current.focus();
  }, [reset, clearRecaptcha]);

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  return (
    <div className="py-10 px-4 mx-auto bg-dark-shade">
      <Theme variant={theme || 'white'}>
        <AnimatePresence>
          {step !== 'success' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center mb-8"
            >
              {tagLine && <Subtitle>{tagLine}</Subtitle>}
              {title && <Title>{title}</Title>}
            </motion.div>
          )}
        </AnimatePresence>
      </Theme>

      <Card className="border-none max-w-md mx-auto shadow-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-3xl">
        <CardContent className="p-6">
          <div id="recaptcha-container" className="hidden" />
          <div aria-live="assertive" className="sr-only">
            {step === 'form' && 'Please fill out the contact form'}
            {step === 'otp' && `Enter the ${config.OTP_LENGTH}-digit OTP sent to ${countryCode}${phone}`}
            {step === 'success' && successMessage}
          </div>

          <AnimatePresence mode="wait">
            {step === 'form' && (
              <motion.div key="form" variants={formVariants} initial="hidden" animate="visible" exit="exit">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(sendOtp)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="w-4 h-4" /> Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              ref={firstFocusRef}
                              placeholder="Your Name"
                              disabled={isLoading}
                              className="rounded-lg bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="w-4 h-4" /> Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="Your Email"
                              disabled={isLoading}
                              className="rounded-lg bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="w-4 h-4" /> Phone
                          </FormLabel>
                          <div className="flex items-center border rounded-lg bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm overflow-hidden">
                            <span className="flex items-center px-3 py-2 gap-1">
                              🇮🇳 {countryCode}
                            </span>
                            <FormControl>
                              <input
                                {...field}
                                type="tel"
                                inputMode="numeric"
                                placeholder="Enter 10-digit number"
                                disabled={isLoading}
                                className="flex-1 px-3 py-2 bg-transparent outline-none border-l"
                                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, config.PHONE_LENGTH))}
                              />
                            </FormControl>
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
                          <FormLabel className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" /> Message
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Your Message"
                              rows={4}
                              disabled={isLoading}
                              className="rounded-lg bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full rounded-lg bg-primary/90 hover:bg-primary hover:scale-105 transition-all"
                    >
                      {isLoading ? (
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
              <motion.div key="otp" variants={formVariants} initial="hidden" animate="visible" exit="exit">
                <Form {...form}>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="w-4 h-4" /> Enter OTP
                          </FormLabel>
                          <p className="text-sm text-gray-500">Sent to {countryCode}{phone}</p>
                          <FormControl>
                            <div className="flex justify-center gap-2">
                              {Array.from({ length: config.OTP_LENGTH }).map((_, i) => (
                                <motion.input
                                  key={i}
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={1}
                                  ref={handleOtpRef(i)}
                                  value={otp?.[i] || ''}
                                  onChange={(e) => handleOtpChange(i, e.target.value)}
                                  disabled={isLoading}
                                  className="w-10 h-12 text-center border rounded-md bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm"
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.3, delay: i * 0.1 }}
                                  aria-label={`OTP digit ${i + 1}`}
                                />
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Resend in 0:{timer.toString().padStart(2, '0')}</span>
                      <button
                        onClick={sendOtp}
                        disabled={timer > 0 || isLoading}
                        className="text-primary disabled:opacity-50"
                      >
                        Resend OTP
                      </button>
                    </div>
                    <Button
                      onClick={verifyAndSubmit}
                      disabled={isLoading || !otp || otp.length !== config.OTP_LENGTH}
                      className="w-full rounded-lg bg-primary/90 hover:bg-primary transition-all"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...
                        </>
                      ) : (
                        'Verify & Send'
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={resetForm}
                      disabled={isLoading}
                      className="w-full rounded-lg"
                    >
                      Edit Phone
                    </Button>
                  </div>
                </Form>
              </motion.div>
            )}
            {step === 'success' && (
              <motion.div
                key="success"
                variants={formVariants}
                initial="hidden"
                animate="visible"
                className="text-center space-y-4"
              >
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                <h3 className="text-xl font-semibold">{successMessage}</h3>
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="rounded-lg"
                >
                  Submit Another
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}