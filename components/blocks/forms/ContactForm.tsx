'use client';

import { useState, useEffect } from 'react';
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
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { CheckCircle2, AlertCircle, Loader2, Mail, User, MessageSquare, Phone } from 'lucide-react';

import { Title, Subtitle, Content } from '@/components/ui/theme/typography';
import PortableTextRenderer from '@/components/portable-text-renderer';

// Define form validation schema with Zod
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
}

export default function ContactForm({ theme, tagLine, title, successMessage }: ContactFormProps) {
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Initialize form with react-hook-form and Zod validation
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

  const { watch } = form;
  const name = watch('name');
  const email = watch('email');
  const phone = watch('phone');
  const otp = watch('otp');
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Initialize reCAPTCHA verifier
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {},
        });
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
      }
    }
  }, []);

  // Handle sending OTP
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
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, verifier);
      setConfirmationResult(result);
      setOtpSent(true);
      setStep('otp');
      toast.success(`OTP sent to +91${phone}`);
    } catch (error: any) {
      toast.error('Failed to send OTP', { description: error.message });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async () => {
    if (!confirmationResult || !otp) return; // Ensure otp is defined
    setIsVerifyingOtp(true);
    try {
      await confirmationResult.confirm(otp); // Now TypeScript knows otp is a string
      setIsVerified(true);
      toast.success('Phone number verified!');
    } catch (error: any) {
      toast.error('Invalid OTP', { description: error.message });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!isVerified) {
      toast.error('Please verify your phone number first');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to submit the form');

      setStep('success');
      toast.success('Message sent successfully!');
    } catch (error: any) {
      toast.error('Failed to submit the form', { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset phone number
  const resetPhone = () => {
    setOtpSent(false);
    form.setValue('phone', '');
    form.setValue('otp', '');
    setConfirmationResult(null);
    setStep('form');
    setIsVerified(false);
  };

  // Render status icons for validation feedback
  const renderStatusIcon = (valid: boolean) => (
    <span className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
      {valid ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <AlertCircle className="h-4 w-4 text-red-500" />
      )}
    </span>
  );

  // Animation variants for form steps
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
            {title && <Title>{title}</Title>}
          </motion.div>
        )}

        <Card className="border-none shadow-lg bg-white/30 dark:bg-gray-800/30 backdrop-blur-md">
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
                      className="w-full rounded-lg bg-primary/90 hover:bg-primary transition-all backdrop-blur-sm"
                    >
                      {isSendingOtp ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending OTP...
                        </>
                      ) : (
                        'Send OTP to Verify'
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
                            <InputOTP
                              maxLength={6}
                              {...field}
                              disabled={isVerifyingOtp || isVerified}
                            >
                              <InputOTPGroup>
                                <InputOTPSlot index={0} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm" />
                                <InputOTPSlot index={1} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm" />
                                <InputOTPSlot index={2} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm" />
                                <InputOTPSlot index={3} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm" />
                                <InputOTPSlot index={4} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm" />
                                <InputOTPSlot index={5} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm" />
                              </InputOTPGroup>
                            </InputOTP>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {!isVerified && (
                      <Button
                        onClick={handleVerifyOtp}
                        disabled={isVerifyingOtp || !otp || otp.length !== 6}
                        className="w-full rounded-lg bg-primary/90 hover:bg-primary transition-all backdrop-blur-sm"
                      >
                        {isVerifyingOtp ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...
                          </>
                        ) : (
                          'Verify OTP'
                        )}
                      </Button>
                    )}
                  </form>
                </Form>

                {isVerified && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4"
                  >
                    <p className="text-sm text-green-600 flex items-center gap-2 mb-4 justify-center">
                      <CheckCircle2 className="w-4 h-4" /> Phone number verified!
                    </p>
                    <Button
                      onClick={form.handleSubmit(onSubmit)}
                      disabled={isSubmitting}
                      className="w-full rounded-lg bg-primary/90 hover:bg-primary transition-all backdrop-blur-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </Button>
                  </motion.div>
                )}
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