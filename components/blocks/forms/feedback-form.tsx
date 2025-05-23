'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, AlertCircle, Loader2, User, Star, CheckCircle, Phone } from 'lucide-react';
import { Title, Subtitle } from '@/components/ui/theme/typography';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  rating: z.number().min(1, 'Rating is required').max(5, 'Rating cannot exceed 5'),
  comment: z.string().min(1, 'Comment is required').max(500, 'Comment must be less than 500 characters'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  otp: z.string().length(6, 'OTP must be 6 digits').optional(),
});

interface ReviewFormProps {
  doctorId: string;
  theme?: ThemeVariant | null;
  tagLine?: string | null;
  title?: string | null;
  successMessage?: string | null;
}

export default function ReviewForm({ doctorId, theme, tagLine, title, successMessage }: ReviewFormProps) {
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
      rating: 5,
      comment: '',
      phone: '',
      otp: '',
    },
  });

  const { watch, setValue } = form;
  const name = watch('name');
  const rating = watch('rating');
  const comment = watch('comment');
  const phone = watch('phone');
  const otp = watch('otp');

  useEffect(() => {
    const saved = Cookies.get('pedia_review_info');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setValue('name', parsed.name || '');
        setValue('rating', parsed.rating || 5);
        setValue('comment', parsed.comment || '');
      } catch (error) {
        console.error('[Cookie] Parse error:', error);
      }
    }
  }, [setValue]);

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

    const container = document.getElementById('recaptcha-review-container');
    if (container) container.innerHTML = '';

    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-review-container', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {},
      });
    } catch (error) {
      console.error('[reCAPTCHA] Init error:', error);
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
      // @ts-expect-error Web OTP API is not typed yet
      navigator.credentials.get({ otp: { transport: ['sms'] }, signal: ac.signal }).then((otpCredential: any) => {
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

  const handleRatingChange = (val: number) => {
    if (!otpSent) setValue('rating', val);
  };

  const handleSendOtp = async () => {
    const errors = form.formState.errors;
    if (errors.name || errors.rating || errors.comment || errors.phone) {
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
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          rating: formData.rating,
          comment: formData.comment,
          doctorId,
          subject: `Review for Doctor ${doctorId}`,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to submit the review');

      Cookies.set(
        'pedia_review_info',
        JSON.stringify({
          name: formData.name,
          rating: formData.rating,
          comment: formData.comment,
        }),
        { expires: 7 }
      );

      setStep('success');
      toast.success('Review submitted successfully!');
    } catch (error: any) {
      toast.error('Verification or submission failed', { description: error.message });
    } finally {
      setIsVerifyingOtp(false);
      setIsSubmitting(false);
    }
  };

  const resetPhone = () => {
    setOtpSent(false);
    setValue('phone', '');
    setValue('otp', '');
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
    <Theme variant={theme || 'white'}>
      <div className="py-10 max-w-lg mx-auto px-4">
        {step !== 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-8"
          >
            {tagLine && <Subtitle>{tagLine}</Subtitle>}
            {title || <Title>Share Your Feedback</Title>}
          </motion.div>
        )}

        <Card className="border-none shadow-lg bg-white/30 backdrop-blur-md rounded-3xl">
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
                          <FormLabel className="flex items-center gap-2 text-gray-700">
                            <User className="w-4 h-4" /> Your Name
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
                      name="rating"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700">
                            <Star className="w-4 h-4" /> Rating
                          </FormLabel>
                          <TooltipProvider>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((val) => (
                                <Tooltip key={val}>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={() => handleRatingChange(val)}
                                      disabled={otpSent}
                                      className="transition-transform duration-150 ease-in-out hover:scale-110 focus:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
                                      aria-label={`Rate ${val} star${val > 1 ? 's' : ''}`}
                                    >
                                      <Star
                                        className={`h-6 w-6 stroke-2 transition-colors ${
                                          val <= rating
                                            ? 'fill-yellow-400 stroke-yellow-500'
                                            : 'fill-transparent stroke-gray-300 hover:stroke-yellow-400'
                                        }`}
                                      />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">{val} star{val > 1 ? 's' : ''}</TooltipContent>
                                </Tooltip>
                              ))}
                            </div>
                          </TooltipProvider>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="comment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700">
                            <CheckCircle className="w-4 h-4" /> Comment
                          </FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Write your feedback..."
                                rows={4}
                                disabled={otpSent}
                                className="rounded-lg border-gray-200/50 bg-white/70 backdrop-blur-sm focus:border-primary focus:ring-0 transition-all resize-none"
                              />
                            </FormControl>
                            {comment && !otpSent && renderStatusIcon(!!comment.trim())}
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
                          <FormLabel className="flex items-center gap-2 text-gray-700">
                            <Phone className="w-4 h-4" /> Phone Number
                          </FormLabel>
                          <div className="relative flex items-center border border-gray-200/50 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-primary bg-white/70 backdrop-blur-sm">
                            <div className="flex items-center px-3 py-2 bg-gray-100/50 text-sm gap-1 shrink-0 text-gray-700">
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
                              <Button type="button" variant="ghost" size="sm" onClick={resetPhone}>
                                Edit
                              </Button>
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div id="recaptcha-review-container" />
                    <Button
                      type="submit"
                      disabled={isSendingOtp}
                      className="w-full rounded-lg bg-primary/90 hover:bg-primary transition-all backdrop-blur-sm"
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP...
                        </>
                      ) : (
                        'Submit Feedback'
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
                          <FormLabel className="flex items-center gap-2 text-gray-700">
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
                  {successMessage || 'Review Submitted Successfully!'}
                </h3>
                <p className="text-muted-foreground text-sm mt-2">
                  Your feedback helps others find the right pediatrician.
                </p>
                <Button onClick={() => window.location.reload()} className="mt-4 rounded-lg">
                  Refresh Page
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </Theme>
  );
}