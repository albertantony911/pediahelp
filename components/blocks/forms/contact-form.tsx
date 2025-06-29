'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
import { CheckCircle2, AlertCircle, Loader2, Mail, User, MessageSquare, Phone } from 'lucide-react';
import { Title, Subtitle } from '@/components/ui/theme/typography';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  message: z.string().min(6, 'Message must be at least 6 characters').max(500, 'Message must be less than 500 characters'),
  otp: z.string().length(6, 'OTP must be 6 digits').optional(),
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

export default function ContactForm({ theme, tagLine, title, successMessage, pageSource = 'Contact Page' }: ContactFormProps) {
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(30);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [recaptchaToken, setRecaptchaToken] = useState<string>('');


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

  const { watch, setValue } = form;
  const name = watch('name');
  const email = watch('email');
  const phone = watch('phone');
  const otp = watch('otp');
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    if (!otpSent || isVerified || timer === 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer, otpSent, isVerified]);

  useEffect(() => {
    if (typeof window === 'undefined' || !auth) {
      console.warn('Skipping reCAPTCHA verifier initialization: window or auth not available');
      return;
    }
  
    const initializeRecaptcha = () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          console.log('Cleared existing reCAPTCHA verifier');
        } catch (error) {
          console.error('Failed to clear existing reCAPTCHA verifier:', error);
        }
      }
  
      const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V2_KEY;
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  
      if (!siteKey) {
        console.error('Missing reCAPTCHA v2 site key. Please set NEXT_PUBLIC_RECAPTCHA_V2_KEY in environment variables.');
        return;
      }
  
      if (!projectId) {
        console.error('Missing Firebase project ID. Please set NEXT_PUBLIC_FIREBASE_PROJECT_ID in environment variables.');
        return;
      }
  
      let verifier: RecaptchaVerifier;
      try {
        console.log('Initializing RecaptchaVerifier with siteKey:', siteKey, 'and projectId:', projectId);
        verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: (token: string) => {
            console.log('Invisible reCAPTCHA passed, token:', token);
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            toast.error('reCAPTCHA expired, please try again');
          },
          // Add reCAPTCHA Enterprise configuration
          recaptchaConfig: {
            provider: 'gcp_recaptcha_enterprise',
            recaptchaEnterpriseSiteKey: siteKey,
            recaptchaEnterpriseProjectId: projectId,
          },
        });
      } catch (error) {
        console.error('Failed to initialize reCAPTCHA verifier:', {
          message: (error as Error).message,
          code: (error as any).code,
          details: (error as any).details,
        });
        return;
      }
  
      window.recaptchaVerifier = verifier;
  
      console.log('RecaptchaVerifier initialized for Enterprise v2');
    };
  
    initializeRecaptcha();
  
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          console.log('Cleared reCAPTCHA verifier on cleanup');
        } catch (error) {
          console.error('Failed to clear reCAPTCHA verifier on cleanup:', error);
        }
        window.recaptchaVerifier = undefined;
      }
    };
  }, [auth]);

  const handleOtpChange = (index: number, value: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (value && !/^\d$/.test(value)) return; // Allow only single digits
    const arr = (otp || '').split('');
    arr[index] = value;
    form.setValue('otp', arr.join(''));

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    } else if (
      !value &&
      index > 0 &&
      event.target.selectionStart === 0 &&
      (event.nativeEvent as InputEvent).inputType === 'deleteContentBackward'
    ) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpInputsRef.current[index]?.value && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
      const arr = (otp || '').split('');
      arr[index - 1] = '';
      form.setValue('otp', arr.join(''));
    } else if (event.key === 'ArrowLeft' && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    } else if (event.key === 'ArrowRight' && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleSendOtp = async () => {
    const errors = form.formState.errors;
    if (errors.name || errors.email || errors.phone || errors.message) {
      toast.error(Object.values(errors)[0]?.message || 'Please fill all fields correctly');
      return;
    }
  
    setIsSendingOtp(true);
    try {
      const verifier = window.recaptchaVerifier;
      if (!verifier) throw new Error('reCAPTCHA not initialized');
  
      // ✅ Execute reCAPTCHA and store token
      const token = await verifier.verify();
      setRecaptchaToken(token);
      console.log('Enterprise reCAPTCHA token:', token);
  
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, verifier);
      setConfirmationResult(result);
      setOtpSent(true);
      setStep('otp');
      setTimer(30);
      setValue('otp', '');
      toast.success(`OTP sent to +91${phone}`);
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast.error('Failed to send OTP', {
        description: error.message || 'An unexpected error occurred during phone authentication',
      });
    } finally {
      setIsSendingOtp(false);
    }
  };
  

  const handleVerifyAndSubmit = async (otpCode: string) => {
    if (!confirmationResult || !otpCode || otpCode.length !== 6) {
      toast.error('Invalid OTP');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const otpResult = await confirmationResult.confirm(otpCode);
      if (!otpResult.user) {
        throw new Error('Phone number verification failed');
      }
      setIsVerified(true);
      toast.success('Phone number verified!');
  
      setIsSubmitting(true);
      const formData = form.getValues();
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        subject: `Contact Form Submission from ${pageSource}`,
        otpVerified: true,
        recaptchaToken,                  
        recaptchaAction: 'contact_submit', 
      };
      console.log('Submitting payload:', payload);
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
  
      let submitResult;
      try {
        submitResult = await response.json();
      } catch (error) {
        console.error('Failed to parse response JSON:', error);
        throw new Error('Invalid response from server');
      }
  
      if (!response.ok) {
        throw new Error(submitResult.error || 'Failed to submit the form');
      }
  
      setStep('success');
      toast.success('Message sent successfully!');
    } catch (error: any) {
      console.error('Error in handleVerifyAndSubmit:', error);
      toast.error('Failed to verify or submit', {
        description: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsVerifyingOtp(false);
      setIsSubmitting(false);
    }
  };

  const resetPhone = () => {
    setOtpSent(false);
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
      <div className="py-10 max-w-lg mx-auto">
        {step !== 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-8"
          >
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
                      const isValid = form.trigger(['name', 'email', 'phone', 'message']);
                      isValid.then((valid) => {
                        if (valid) handleSendOtp();
                        else {
                          const errors = form.formState.errors;
                          toast.error(Object.values(errors)[0]?.message || 'Please fill all fields correctly');
                        }
                      });
                    }}
                  >
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
                    <div id="recaptcha-container" />
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
                        onClick={handleSendOtp}
                        disabled={timer > 0 || isSendingOtp}
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
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {successMessage || 'Message Sent Successfully!'}
                </h3>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </Theme>
  );
}