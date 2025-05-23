'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { CheckCircle2, AlertCircle, Loader2, User, Mail, Phone, FileText, Briefcase, X } from 'lucide-react';
import { Title, Subtitle } from '@/components/ui/theme/typography';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Phone must be 10 digits'),
  jobTitle: z.string().min(1, 'Job title is required').max(100, 'Job title must be less than 100 characters'),
  coverLetter: z.string().min(1, 'Cover letter is required').max(1000, 'Cover letter must be less than 1000 characters'),
  resumeLink: z.string().url('Invalid URL').refine(
    (url) => url.match(/https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+\/view\?usp=sharing/),
    'Must be a valid Google Drive shareable link (e.g., https://drive.google.com/file/d/{fileId}/view?usp=sharing)'
  ),
  otp: z.string().length(6, 'OTP must be 6 digits').optional(),
});

interface CareerFormProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: ThemeVariant | null;
  tagLine?: string | null;
  title?: string | null;
  successMessage?: string | null;
}

export default function CareerForm({ isOpen, onClose, theme, tagLine, title, successMessage }: CareerFormProps) {
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifiedOtp] = useState(false);
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
      jobTitle: '',
      coverLetter: '',
      resumeLink: '',
      otp: '',
    },
  });

  const { watch, setValue } = form;
  const name = watch('name');
  const email = watch('email');
  const phone = watch('phone');
  const jobTitle = watch('jobTitle');
  const coverLetter = watch('coverLetter');
  const resumeLink = watch('resumeLink');
  const otp = watch('otp');

  useEffect(() => {
    if (!isOpen) {
      setStep('form');
      setOtpSent(false);
      setConfirmationResult(null);
      setIsVerified(false);
      setTimer(30);
      form.reset();
    }
  }, [isOpen, form]);

  useEffect(() => {
    const saved = Cookies.get('pedia_career_info');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setValue('name', parsed.name || '');
        setValue('email', parsed.email || '');
        setValue('coverLetter', parsed.coverLetter || '');
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

    const container = document.getElementById('recaptcha-career-container');
    if (container) container.innerHTML = '';

    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-career-container', {
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
      navigator.credentials.get({
        otp: { transport: ['sms'] },
        signal: ac.signal
      } as any).then((otpCredential: any) => {
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
    if (Object.keys(errors).length > 0) {
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
    setIsVerifiedOtp(true);
    try {
      await confirmationResult.confirm(otpCode);
      setIsVerified(true);
      toast.success('Phone number verified!');

      setIsSubmitting(true);
      const formData = form.getValues();
      const response = await fetch('/api/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          jobTitle: formData.jobTitle,
          coverLetter: formData.coverLetter,
          resumeLink: formData.resumeLink,
          subject: 'Career Application',
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to submit application');

      Cookies.set(
        'pedia_career_info',
        JSON.stringify({
          name: formData.name,
          email: formData.email,
          coverLetter: formData.coverLetter,
        }),
        { expires: 7 }
      );

      setStep('success');
      toast.success('Application submitted successfully!');
    } catch (error: any) {
      toast.error('Verification or submission failed', { description: error.message });
    } finally {
      setIsVerifiedOtp(false);
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
        <AlertCircle className="h-4 text-red-500" />
      )}
    </span>
  );

  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: 'easeIn' } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Theme variant={theme || 'white'}>
              <Card className="border-none shadow-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-md">
                <CardHeader className="relative">
                  <CardTitle className="text-center">
                    {title || <Title>Apply for a Career</Title>}
                  </CardTitle>
                  {tagLine && <Subtitle className="text-center">{tagLine}</Subtitle>}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={onClose}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </CardHeader>
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
                                <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                  <User className="w-4 h-4" /> Full Name
                                </FormLabel>
                                <div className="relative">
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Your full name"
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
                                  <Mail className="w-4 h-4" /> Email Address
                                </FormLabel>
                                <div className="relative">
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="email"
                                      placeholder="your.email@example.com"
                                      disabled={otpSent}
                                      className="rounded-lg border-gray-200/50 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:border-primary focus:ring-0 transition-all"
                                    />
                                  </FormControl>
                                  {email && !otpSent && renderStatusIcon(form.formState.errors.email == null)}
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
                                    <Button type="button" variant="ghost" size="sm" onClick={resetPhone}>
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
                            name="jobTitle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                  <Briefcase className="w-4 h-4" /> Job Title
                                </FormLabel>
                                <div className="relative">
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="Position you are applying for"
                                      disabled={otpSent}
                                      className="rounded-lg border-gray-200/50 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:border-primary focus:ring-0 transition-all"
                                    />
                                  </FormControl>
                                  {jobTitle && !otpSent && renderStatusIcon(!!jobTitle.trim())}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="coverLetter"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2 text-gray-7
                                00 dark:text-gray-300">
                                  <FileText className="w-4 h-4" /> Cover Letter
                                </FormLabel>
                                <div className="relative">
                                  <FormControl>
                                    <Textarea
                                      {...field}
                                      placeholder="Write your cover letter..."
                                      rows={4}
                                      disabled={otpSent}
                                      className="rounded-lg border-gray-200/50 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:border-primary focus:ring-0 transition-all resize-none"
                                    />
                                  </FormControl>
                                  {coverLetter && !otpSent && renderStatusIcon(!!coverLetter.trim())}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="resumeLink"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                  <FileText className="w-4 h-4" /> Resume (Google Drive Link)
                                </FormLabel>
                                <div className="relative">
                                  <FormControl>
                                    <Input
                                      {...field}
                                      placeholder="https://drive.google.com/file/d/..."
                                      disabled={otpSent}
                                      className="rounded-lg border-gray-200/50 bg-white/50 dark:bg-gray-700/50 backdrop-blur-sm focus:border-primary focus:ring-0 transition-all"
                                    />
                                  </FormControl>
                                  {resumeLink && !otpSent && renderStatusIcon(form.formState.errors.resumeLink == null)}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  Ensure the link is set to <strong>“Anyone with the link”</strong> access in Google Drive.
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div id="recaptcha-career-container" />
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
                                'Verify & Submit'
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
                        {successMessage || 'Application Submitted Successfully!'}
                      </h3>
                      <p className="text-muted-foreground text-sm mt-2">
                        Thank you for applying. We’ll review your application soon.
                      </p>
                      <Button onClick={onClose} className="mt-4">
                        Close
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </Theme>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}