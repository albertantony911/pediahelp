'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
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

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  question: z.string().min(6, 'Question must be at least 6 characters').max(500, 'Question must be less than 500 characters'),
  otp: z.string().length(6, 'OTP must be 6 digits').optional(),
});

interface BlogQuestionFormProps {
  slug: string;
  blogTitle: string;
  successMessage?: string | null;
}

export default function BlogQuestionForm({ slug, blogTitle, successMessage }: BlogQuestionFormProps) {
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(30);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      question: '',
      otp: '',
    },
  });

  const { watch, setValue } = form;
  const name = watch('name');
  const email = watch('email');
  const phone = watch('phone');
  const question = watch('question');
  const otp = watch('otp');
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    if (!otpSent || isVerified || timer === 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, otpSent, isVerified]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = undefined;
    }

    const container = document.getElementById('recaptcha-blog-question');
    if (container) container.innerHTML = '';

    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-blog-question', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {},
      });
    } catch (error) {
      console.error('Error initializing reCAPTCHA:', error);
    }

    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  useEffect(() => {
    if ('OTPCredential' in window && confirmationResult) {
      const ac = new AbortController();
      navigator.credentials.get({ otp: { transport: ['sms'] }, signal: ac.signal } as any).then((otpCredential: any) => {
        if (otpCredential?.code) {
          form.setValue('otp', otpCredential.code);
          handleVerifyAndSubmit(otpCredential.code);
        }
      }).catch((err: Error) => {
        console.error('Web OTP API error:', err);
      });
      return () => ac.abort();
    }
  }, [confirmationResult, form]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const arr = (otp || '').split('');
    arr[index] = value;
    form.setValue('otp', arr.join(''));

    if (value && index < 5) otpInputsRef.current[index + 1]?.focus();
    else if (!value && index > 0) otpInputsRef.current[index - 1]?.focus();
  };

  const handleSendOtp = async () => {
    const errors = form.formState.errors;
    if (errors.name || errors.email || errors.phone || errors.question) {
      toast.error(Object.values(errors)[0]?.message || 'Please fill all fields correctly');
      return;
    }

    setIsSendingOtp(true);
    try {
      const verifier = window.recaptchaVerifier;
      if (!verifier) throw new Error('reCAPTCHA not initialized');
      await verifier.verify();
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, verifier);
      setConfirmationResult(result);
      setOtpSent(true);
      setStep('otp');
      setTimer(30);
      toast.success(`OTP sent to +91${phone}`);
    } catch (error: any) {
      toast.error('Failed to send OTP', { description: error.message });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyAndSubmit = async (otpCode: string) => {
    if (!confirmationResult || !otpCode || otpCode.length !== 6) return;
    setIsVerifyingOtp(true);
    try {
      await confirmationResult.confirm(otpCode);
      setIsVerified(true);
      toast.success('Phone number verified!');

      setIsSubmitting(true);
      const formData = form.getValues();
      const response = await fetch('/api/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slug,
          subject: `Question about "${blogTitle}"`,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to submit the question');

      setStep('success');
      toast.success('Question submitted successfully!');
    } catch (error: any) {
      toast.error('Verification or submission failed', { description: error.message });
    } finally {
      setIsVerifyingOtp(false);
      setIsSubmitting(false);
    }
  };

  const resetPhone = () => {
    setOtpSent(false);
    form.setValue('phone', '');
    form.setValue('otp', '');
    setConfirmationResult(null);
    setStep('form');
    setIsVerified(false);
    setTimer(30);
  };

  const renderStatusIcon = (valid: boolean) => (
    <span className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
      {valid ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <AlertCircle className="h-4 w-4 text-red-500" />
      )}
    </span>
  );

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
  };

  return (
    <div className="max-sm:pb-5 max-sm:pt-5 max-w-lg bg-dark-shade">
      <Card className="border-white/20 shadow-xl bg-white/10 backdrop-blur-md rounded-3xl">
        <CardContent className="p-6">
          {step === 'form' && (
            <motion.div variants={formVariants} initial="hidden" animate="visible" exit="exit">
              <Form {...form}>
                <form className="space-y-4" onSubmit={form.handleSubmit(handleSendOtp)}>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-white/60">
                          <User className="w-4 h-4" /> Name
                        </FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Your Name"
                              disabled={otpSent}
                              className="rounded-lg border-gray-200/50 bg-white/70 backdrop-blur-sm focus:border-primary focus:ring-0 transition-all"
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
                        <FormLabel className="flex items-center gap-2 text-white/60">
                          <Mail className="w-4 h-4" /> Email
                        </FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Your Email"
                              type="email"
                              disabled={otpSent}
                              className="rounded-lg border-gray-200/50 bg-white/70 backdrop-blur-sm focus:border-primary focus:ring-0 transition-all"
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
                        <FormLabel className="flex items-center gap-2 text-white/60">
                          <Phone className="w-4 h-4" /> Phone Number
                        </FormLabel>
                        <div className="relative flex items-center border border-gray-200/50 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-primary bg-white/70 backdrop-blur-sm">
                          <div className="flex items-center px-3 py-2 bg-gray-100/50 text-sm gap-1 shrink-0 text-gray-500">
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
                              className="w-full px-3 py-2 bg-transparent outline-none text-sm text-gray-900"
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
                    name="question"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-white/60">
                          <MessageSquare className="w-4 h-4" /> Your Question
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Your Question"
                            rows={3}
                            disabled={otpSent}
                            className="rounded-lg border-gray-200/50 bg-white/70 backdrop-blur-sm focus:border-primary focus:ring-0 transition-all resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div id="recaptcha-blog-question" />
                  <Button
                    type="submit"
                    disabled={isSendingOtp}
                    className="w-full rounded-lg bg-primary/90 shadow-lg hover:bg-primary transition-all backdrop-blur-sm"
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP...
                      </>
                    ) : (
                      'Submit Question'
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
                        <FormLabel className="flex items-center gap-2 text-white/60">
                          <Phone className="w-4 h-4" /> Enter OTP
                        </FormLabel>
                        <p className="text-sm text-muted-foreground mb-2">
                          OTP sent to <span className="font-semibold">+91{phone}</span>
                        </p>
                        <FormControl>
                          <div className="flex justify-center gap-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                              <motion.input
                                key={i}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                className="w-10 h-12 text-lg text-center border border-gray-300 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white/90 backdrop-blur-sm disabled:opacity-50"
                                ref={(el) => {
                                  otpInputsRef.current[i] = el;
                                }}
                                value={otp?.[i] || ''}
                                onChange={(e) => handleOtpChange(i, e.target.value)}
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
                      onClick={handleSendOtp}
                      disabled={timer > 0}
                      className={timer > 0 ? 'opacity-50 cursor-not-allowed text-primary' : 'text-primary'}
                    >
                      Resend OTP
                    </button>
                  </div>
                  {!isVerified && (
                    <Button
                      onClick={() => otp && handleVerifyAndSubmit(otp)}
                      disabled={isVerifyingOtp || !otp || otp.length !== 6}
                      className="w-full rounded-lg bg-primary/90 hover:bg-primary transition-all backdrop-blur-sm"
                    >
                      {isVerifyingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...
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
            <motion.div
              variants={formVariants}
              initial="hidden"
              animate="visible"
              className="text-center"
            >
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900">
                {successMessage || 'Question Sent Successfully!'}
              </h3>
              <p className="text-muted-foreground text-sm mt-2">
                We’ll get back to you shortly via email.
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}