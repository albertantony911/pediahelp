'use client';

import { forwardRef, useState, useEffect, useRef, useCallback } from 'react';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2, Mail, User, MessageSquare, Phone } from 'lucide-react';
import { Title, Subtitle } from '@/components/ui/theme/typography';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Form schema
const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  message: z.string().min(6, 'Message must be at least 6 characters').max(500, 'Message must be less than 500 characters'),
  otp: z.string().length(6, 'OTP must be 6 digits').optional(),
});

interface ContactFormProps {
  _type?: 'contact-form';
  _key?: string;
  theme?: ThemeVariant | null;
  tagLine?: string | null;
  title?: string | null;
  successMessage?: string | null;
  pageSource?: string;
  countryCode?: string;
}

// Error type
interface Errors {
  fieldErrors: Record<string, string>;
  authError: string | null;
  submissionError: string | null;
}

// Forward-ref wrapped Input component
const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={`px-3 py-2 rounded-lg border-gray-200/50 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:border-primary focus:ring-0 disabled:opacity-50 transition-all ${className}`}
      {...props}
    />
  )
);
Input.displayName = 'Input';

// Forward-ref wrapped Textarea component
const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`px-3 py-2 rounded-lg border-gray-200/50 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:border-primary focus:ring-0 disabled:opacity-50 transition-all resize-none ${className}`}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

// Custom hook for reCAPTCHA
const useRecaptcha = () => {
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const isInitialized = useRef(false);

  const initializeRecaptcha = useCallback(async () => {
    if (typeof window === 'undefined' || isInitialized.current) return true;
    try {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
      isInitialized.current = true;
      console.log('Recaptcha initialized successfully');
      return true;
    } catch (error) {
      console.error('Recaptcha initialization failed:', error);
      throw new Error('Security verification failed. Please try again later.');
    }
  }, []);

  const clearRecaptcha = useCallback(() => {
    if (recaptchaRef.current) {
      recaptchaRef.current.clear();
      recaptchaRef.current = null;
      isInitialized.current = false;
      console.log('Recaptcha cleared');
    }
  }, []);

  return { recaptchaRef, initializeRecaptcha, clearRecaptcha };
};

// Custom hook for OTP timer
const useOtpTimer = () => {
  const [timer, setTimer] = useState(30);
  const [expiry, setExpiry] = useState<number | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastAnnouncedTimer = useRef<number | null>(null);

  const startTimer = useCallback((newExpiry: number) => {
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setExpiry(newExpiry);
    setTimer(30);
    lastAnnouncedTimer.current = null;
    console.log('Timer started with expiry:', newExpiry);
  }, []);

  const clearTimer = useCallback(() => {
    setExpiry(null);
    setTimer(30);
    lastAnnouncedTimer.current = null;
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    console.log('Timer cleared');
  }, []);

  useEffect(() => {
    if (!expiry) return;

    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((expiry - now) / 1000));
      setTimer(remaining);
      if ([30, 20, 10, 5, 0].includes(remaining) && lastAnnouncedTimer.current !== remaining) {
        lastAnnouncedTimer.current = remaining;
        console.log('Timer:', remaining);
      }
      if (remaining > 0) {
        rafIdRef.current = requestAnimationFrame(updateTimer);
      } else {
        rafIdRef.current = null;
      }
    };
    rafIdRef.current = requestAnimationFrame(updateTimer);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [expiry]);

  return { timer, startTimer, clearTimer };
};

// Custom hook for phone authentication
const usePhoneAuth = (countryCode: string) => {
  const { recaptchaRef, initializeRecaptcha, clearRecaptcha } = useRecaptcha();
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  const sendOtp = useCallback(
    async (phone: string, setErrors: (errors: Errors) => void): Promise<boolean> => {
      console.log('sendOtp called with phone:', phone);
      try {
        const success = await initializeRecaptcha();
        if (!success || !recaptchaRef.current) {
          setErrors({ fieldErrors: {}, authError: 'Security verification not ready. Please try again.', submissionError: null });
          toast.error('Security verification not ready. Please try again.', { id: 'recaptcha-error' });
          console.error('Recaptcha not initialized');
          return false;
        }

        const result = await signInWithPhoneNumber(auth, `${countryCode}${phone}`, recaptchaRef.current);
        setConfirmationResult(result);
        setOtpSent(true);
        setErrors({ fieldErrors: {}, authError: null, submissionError: null });
        toast.success(`OTP sent to ${countryCode}${phone}`, { id: 'otp-sent' });
        console.log('OTP sent successfully');
        return true;
      } catch (error: any) {
        const errorMessage =
          error.code === 'auth/too-many-requests'
            ? 'Too many attempts. Please try again later.'
            : error.code === 'auth/invalid-phone-number'
            ? 'Invalid phone number format.'
            : error.message || 'Failed to send OTP. Please try again.';
        setErrors({ fieldErrors: {}, authError: errorMessage, submissionError: null });
        toast.error(errorMessage, { id: 'recaptcha-error' });
        console.error('sendOtp error:', errorMessage);
        return false;
      }
    },
    [initializeRecaptcha, recaptchaRef, countryCode]
  );

  const verifyOtp = useCallback(
    async (otp: string, setErrors: (errors: Errors) => void): Promise<boolean> => {
      console.log('verifyOtp called with otp:', otp);
      if (!confirmationResult || !otp || otp.length !== 6) {
        console.error('Invalid OTP or confirmation result');
        return false;
      }

      try {
        await confirmationResult.confirm(otp);
        setErrors({ fieldErrors: {}, authError: null, submissionError: null });
        toast.success('OTP verified successfully!', { id: 'otp-verified' });
        console.log('OTP verified successfully');
        return true;
      } catch (error: any) {
        const errorMessage =
          error.code === 'auth/invalid-verification-code'
            ? 'Invalid OTP. Please try again.'
            : error.code === 'auth/expired-verification-code'
            ? 'OTP has expired. Please request a new one.'
            : 'Verification failed. Please try again.';
        setErrors({ fieldErrors: {}, authError: errorMessage, submissionError: null });
        toast.error(errorMessage, { id: 'otp-error' });
        console.error('verifyOtp error:', errorMessage);
        return false;
      }
    },
    [confirmationResult]
  );

  const resetAuth = useCallback(() => {
    setOtpSent(false);
    setConfirmationResult(null);
    clearRecaptcha();
    console.log('Auth reset');
  }, [clearRecaptcha]);

  return { sendOtp, verifyOtp, resetAuth, otpSent };
};

// Custom OTP input group component
const OtpInputGroup = ({
  value,
  onChange,
  disabled,
  error,
  firstRef,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  error: boolean;
  firstRef?: React.MutableRefObject<HTMLInputElement | null>;
}) => {
  const inputRef0 = useRef<HTMLInputElement | null>(null);
  const inputRef1 = useRef<HTMLInputElement | null>(null);
  const inputRef2 = useRef<HTMLInputElement | null>(null);
  const inputRef3 = useRef<HTMLInputElement | null>(null);
  const inputRef4 = useRef<HTMLInputElement | null>(null);
  const inputRef5 = useRef<HTMLInputElement | null>(null);

  const inputRefs = [inputRef0, inputRef1, inputRef2, inputRef3, inputRef4, inputRef5];

  // Sync input values with state
  useEffect(() => {
    inputRefs.forEach((ref, i) => {
      if (ref.current) ref.current.value = value[i] || '';
    });
  }, [value]);

  const handleChange = (index: number, inputValue: string) => {
    if (!/^\d?$/.test(inputValue)) return;

    const newValue = (value || '').split('');
    newValue[index] = inputValue;
    const joinedValue = newValue.join('');
    onChange(joinedValue);

    if (inputValue && index < 5) inputRefs[index + 1].current?.focus();
    else if (!inputValue && index > 0) inputRefs[index - 1].current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      onChange(pastedData);
      inputRefs.forEach((ref, i) => {
        if (ref.current) ref.current.value = pastedData[i] || '';
      });
      if (pastedData.length === 6) {
        inputRefs[5].current?.focus();
      } else {
        inputRefs[pastedData.length]?.current?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === 'Delete' && index < 5) {
      inputRefs[index + 1].current?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs[index - 1].current?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className="flex justify-center gap-2" role="group" aria-label="OTP input fields">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          ref={(el) => {
            inputRefs[i].current = el;
            if (i === 0 && firstRef) firstRef.current = el;
          }}
          value={value[i] || ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onPaste={(e) => handlePaste(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onFocus={handleFocus}
          disabled={disabled}
          className="w-10 h-12 text-lg text-center border border-gray-300 rounded-md focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm aria-invalid:border-red-500"
          aria-label={`OTP digit ${i + 1}`}
          aria-describedby={error ? 'otp-error' : undefined}
          aria-invalid={error}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
        />
      ))}
    </div>
  );
};

// Custom hook for contact form logic
const useContactForm = (pageSource: string, countryCode: string) => {
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

  const { timer, startTimer, clearTimer } = useOtpTimer();
  const { sendOtp, verifyOtp, resetAuth, otpSent } = usePhoneAuth(countryCode);
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [errors, setErrors] = useState<Errors>({ fieldErrors: {}, authError: null, submissionError: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const firstOtpInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (step === 'form' && firstInputRef.current) {
      firstInputRef.current.focus();
    } else if (step === 'otp' && firstOtpInputRef.current) {
      firstOtpInputRef.current.focus();
    }
  }, [step]);

  useEffect(() => {
    if ('OTPCredential' in window && step === 'otp') {
      const ac = new AbortController();
      navigator.credentials.get({ otp: { transport: ['sms'] }, signal: ac.signal } as any).then((otpCredential: any) => {
        if (otpCredential?.code) {
          form.setValue('otp', otpCredential.code, { shouldValidate: true });
          handleVerifyAndSubmit();
        }
      }).catch((err: Error) => {
        console.error('Web OTP API error:', err);
      });
      return () => ac.abort();
    }
  }, [step]);

  useEffect(() => {
    return () => {
      clearTimer();
      resetAuth();
    };
  }, [clearTimer, resetAuth]);

  const handleSendOtp = useCallback(async () => {
    console.log('handleSendOtp called');
    if (isSubmitting || isSendingOtp) {
      console.log('Blocked: isSubmitting or isSendingOtp true');
      return false;
    }

    setIsSubmitting(true);
    setIsSendingOtp(true);
    try {
      clearTimer();
      const result = await form.trigger(['name', 'email', 'phone', 'message'], { shouldFocus: false });
      const fieldErrors: Record<string, string> = {};
      if (!result) {
        const errors = form.formState.errors;
        if (errors.name) fieldErrors.name = errors.name.message || 'Invalid name';
        if (errors.email) fieldErrors.email = errors.email.message || 'Invalid email';
        if (errors.phone) fieldErrors.phone = errors.phone.message || 'Invalid phone';
        if (errors.message) fieldErrors.message = errors.message.message || 'Invalid message';
        setErrors({ fieldErrors, authError: null, submissionError: null });
        form.setValue('otp', '');
        console.log('Validation failed:', fieldErrors);
        toast.error(Object.values(fieldErrors)[0] || 'Please fill all fields correctly', { id: 'validation-error' });
        return false;
      }

      const phone = form.getValues('phone');
      console.log('Sending OTP to phone:', phone);
      const success = await sendOtp(phone, setErrors);
      if (success) {
        setStep('otp');
        startTimer(Date.now() + 30000);
        console.log('OTP step activated');
      }
      return success;
    } catch (error) {
      console.error('handleSendOtp error:', error);
      setErrors({ fieldErrors: {}, authError: 'Failed to send OTP. Please try again.', submissionError: null });
      toast.error('Failed to send OTP. Please try again.', { id: 'send-otp-error' });
      return false;
    } finally {
      setIsSubmitting(false);
      setIsSendingOtp(false);
      console.log('handleSendOtp completed');
    }
  }, [form, sendOtp, startTimer, clearTimer, isSubmitting, isSendingOtp]);

  const resendOtp = useCallback(async () => {
    console.log('resendOtp called');
    if (isSubmitting || isSendingOtp || timer > 0) {
      console.log('Blocked: isSubmitting, isSendingOtp, or timer > 0');
      return false;
    }

    setIsSubmitting(true);
    setIsSendingOtp(true);
    try {
      clearTimer();
      const phone = form.getValues('phone');
      const success = await sendOtp(phone, setErrors);
      if (success) {
        startTimer(Date.now() + 30000);
        console.log('OTP resent');
      }
      return success;
    } catch (error) {
      console.error('resendOtp error:', error);
      setErrors({ fieldErrors: {}, authError: 'Failed to resend OTP. Please try again.', submissionError: null });
      toast.error('Failed to resend OTP. Please try again.', { id: 'resend-otp-error' });
      return false;
    } finally {
      setIsSubmitting(false);
      setIsSendingOtp(false);
      console.log('resendOtp completed');
    }
  }, [form, sendOtp, timer, startTimer, clearTimer, isSubmitting, isSendingOtp]);

  const handleVerifyAndSubmit = useCallback(async () => {
    console.log('handleVerifyAndSubmit called');
    const otp = form.getValues('otp');
    if (!otp || otp.length !== 6 || isSubmitting || isVerifyingOtp) {
      console.log('Blocked: invalid OTP or submitting/verifying');
      return;
    }

    setIsSubmitting(true);
    setIsVerifyingOtp(true);
    try {
      const verified = await verifyOtp(otp, setErrors);
      if (verified) {
        try {
          await submitFormData(form.getValues(), pageSource, countryCode);
          setStep('success');
          setErrors({ fieldErrors: {}, authError: null, submissionError: null });
          clearTimer();
          resetAuth();
          toast.success('Form submitted successfully!', { id: 'form-submitted' });
          console.log('Form submitted successfully');
        } catch (error) {
          setErrors({ fieldErrors: {}, authError: null, submissionError: 'Failed to submit form. Please try again.' });
          toast.error('Failed to submit form. Please try again.', { id: 'submission-error' });
          console.error('Submission error:', error);
        }
      }
    } catch (error) {
      console.error('handleVerifyAndSubmit error:', error);
    } finally {
      setIsSubmitting(false);
      setIsVerifyingOtp(false);
      console.log('handleVerifyAndSubmit completed');
    }
  }, [form, verifyOtp, pageSource, clearTimer, resetAuth, countryCode, isSubmitting, isVerifyingOtp]);

  const resetOtp = useCallback(() => {
    clearTimer();
    resetAuth();
    setStep('form');
    setErrors({ fieldErrors: {}, authError: null, submissionError: null });
    form.setValue('otp', '');
    console.log('OTP reset');
  }, [form, clearTimer, resetAuth]);

  const resetForm = useCallback(() => {
    form.reset();
    resetOtp();
    clearTimer();
    resetAuth();
    setStep('form');
    setErrors({ fieldErrors: {}, authError: null, submissionError: null });
    console.log('Form reset');
  }, [form, resetOtp, clearTimer, resetAuth]);

  return {
    form,
    step,
    isSendingOtp,
    isVerifyingOtp,
    otpSent,
    timer,
    errors,
    isSubmitting,
    sendOtp: handleSendOtp,
    resendOtp,
    resetOtp,
    handleVerifyAndSubmit,
    resetForm,
    firstInputRef,
    firstOtpInputRef,
  };
};

// Utility function for form submission
const submitFormData = async (formData: z.infer<typeof formSchema>, pageSource: string, countryCode: string) => {
  console.log('submitFormData called with data:', formData);
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...formData,
      phone: `${countryCode}${formData.phone}`,
      subject: `Contact Form Submission from ${pageSource}`,
      otpVerified: true,
    }),
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    console.error('Submission failed with status:', response.status);
    throw new Error('Submission failed');
  }
  console.log('Submission successful');
};

// Animation variants
const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
};

// Main component
export default function ContactForm({
  theme = null,
  tagLine = null,
  title = null,
  successMessage = 'Message Sent Successfully!',
  pageSource = 'Contact Page',
  countryCode = '+91',
}: ContactFormProps) {
  const {
    form,
    step,
    isSendingOtp,
    isVerifyingOtp,
    otpSent,
    timer,
    errors,
    isSubmitting,
    sendOtp,
    resendOtp,
    resetOtp,
    handleVerifyAndSubmit,
    resetForm,
    firstInputRef,
    firstOtpInputRef,
  } = useContactForm(pageSource, countryCode);

  const { watch } = form;
  const phone = watch('phone');
  const name = watch('name');
  const email = watch('email');
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const renderStatusIcon = (valid: boolean) => (
    <span className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
      {valid ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <AlertCircle className="h-4 w-4 text-red-500" />
      )}
    </span>
  );

  return (
    <Theme variant={theme || 'white'}>
      <div className="py-10 max-w-md mx-auto">
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

        <Card className="border-none shadow-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-3xl">
          <CardContent className="p-6">
            <div id="recaptcha-container" className="hidden" />
            <div aria-live="assertive" className="sr-only">
              {Object.values(errors.fieldErrors).filter(Boolean).length > 0 &&
                `Field errors: ${Object.values(errors.fieldErrors).filter(Boolean).join(', ')}`}
              {errors.authError && `Authentication error: ${errors.authError}`}
              {errors.submissionError && `Submission error: ${errors.submissionError}`}
              {step === 'form' && 'Please fill out the contact form'}
              {step === 'otp' && `Enter the 6-digit OTP sent to ${countryCode}${phone}`}
              {timer > 0 && step === 'otp' && [30, 20, 10, 5, 0].includes(timer) &&
                `${timer} seconds remaining to resend OTP`}
              {timer === 0 && step === 'otp' && 'OTP has expired. Please request a new one.'}
              {step === 'success' && successMessage}
            </div>

            {(Object.values(errors.fieldErrors).filter(Boolean).length > 0 ||
              errors.authError ||
              errors.submissionError) && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4" role="alert">
                {Object.entries(errors.fieldErrors).map(([key, error]) => (
                  <p key={key}>{error}</p>
                ))}
                {errors.authError && <p>{errors.authError}</p>}
                {errors.submissionError && <p>{errors.submissionError}</p>}
              </div>
            )}

            {step === 'form' && (
              <motion.div variants={formVariants} initial="hidden" animate="visible" exit="exit">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(() => sendOtp())} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <User className="w-4 h-4" /> Name
                          </FormLabel>
                          <div className="relative w-full">
                            <FormControl>
                              <Input className="w-full"
                                {...field}
                                ref={firstInputRef}
                                placeholder="Your Name"
                                disabled={otpSent || isSubmitting}
                                aria-describedby={errors.fieldErrors.name ? 'name-error' : undefined}
                                aria-invalid={!!errors.fieldErrors.name}
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
                          <div className="relative w-full">
                            <FormControl>
                              <Input className="w-full"
                                {...field}
                                type="email"
                                placeholder="Your Email"
                                disabled={otpSent || isSubmitting}
                                aria-describedby={errors.fieldErrors.email ? 'email-error' : undefined}
                                aria-invalid={!!errors.fieldErrors.email}
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
                          <div className="flex items-center border border-gray-200/50 rounded-lg overflow-hidden bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm">
                            <span className="flex items-center px-3 py-2 gap-1 bg-gray-100/50 dark:bg-gray-600/50 text-sm text-gray-700 dark:text-gray-300" aria-label="India country code">
                              🇮🇳 {countryCode}
                            </span>
                            <FormControl>
                              <input
                                {...field}
                                type="tel"
                                inputMode="numeric"
                                placeholder="Enter 10-digit number"
                                disabled={otpSent || isSubmitting}
                                className="flex-1 px-3 py-2 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100"
                                onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                aria-describedby={
                                  errors.fieldErrors.phone
                                    ? 'phone-error'
                                    : errors.authError
                                    ? 'auth-error'
                                    : undefined
                                }
                                aria-invalid={!!errors.fieldErrors.phone || !!errors.authError}
                              />
                            </FormControl>
                            {otpSent && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={resetOtp}
                                disabled={isSubmitting}
                                className="text-sm"
                              >
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
                              disabled={otpSent || isSubmitting}
                              aria-describedby={errors.fieldErrors.message ? 'message-error' : undefined}
                              aria-invalid={!!errors.fieldErrors.message}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={isSendingOtp || isSubmitting}
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
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Phone className="w-4 h-4" /> Enter OTP
                          </FormLabel>
                          <p className="text-sm text-muted-foreground mb-2">
                            OTP sent to <span className="font-semibold">{countryCode}{phone}</span>
                          </p>
                          <FormControl>
                            <OtpInputGroup
                              value={field.value || ''}
                              onChange={(value) => form.setValue('otp', value, { shouldValidate: true })}
                              disabled={isVerifyingOtp || isSubmitting}
                              error={!!errors.authError}
                              firstRef={firstOtpInputRef}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Resend in 0:{timer.toString().padStart(2, '0')}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => resendOtp()}
                              disabled={timer > 0 || isSubmitting}
                              className={timer > 0 ? 'opacity-50 cursor-not-allowed text-primary' : 'text-primary'}
                            >
                              Resend OTP
                            </button>
                          </TooltipTrigger>
                          {timer > 0 && (
                            <TooltipContent>
                              Wait {timer} seconds to resend OTP
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Button
                      onClick={handleVerifyAndSubmit}
                      disabled={isVerifyingOtp || isSubmitting || form.getValues('otp')?.length !== 6}
                      className="w-full rounded-lg bg-primary/90 hover:bg-primary hover:scale-105 transition-all backdrop-blur-sm"
                    >
                      {isVerifyingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...
                        </>
                      ) : (
                        'Verify & Send'
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={resetOtp}
                      disabled={isSubmitting}
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
                variants={formVariants}
                initial="hidden"
                animate="visible"
                className="text-center space-y-4"
              >
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {successMessage}
                </h3>
                <Button
                  variant="outline"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="rounded-lg"
                >
                  Submit Another
                </Button>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </Theme>
  );
}