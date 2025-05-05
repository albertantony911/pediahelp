'use client';

import { useState, useEffect } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';

import { Theme, ThemeVariant } from '@/components/ui/theme/Theme';
import { Title, Subtitle } from '@/components/ui/theme/typography';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ContactFormProps {
  theme?: ThemeVariant | null;
  tagLine?: string | null;
  title?: string | null;
  successMessage?: string | null;
}

export default function ContactForm({ theme, tagLine, title, successMessage }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    otp: '',
  });

  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isPhoneValid = /^\d{10}$/.test(formData.phone);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const isFormValid = formData.name && isPhoneValid && isEmailValid && formData.message.length > 5;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = undefined;
    }

    const container = document.getElementById('recaptcha-contact-form');
    if (container) container.innerHTML = '';

    const verifier = new RecaptchaVerifier(auth, 'recaptcha-contact-form', {
      size: 'invisible',
      callback: (response: string) => console.log('[reCAPTCHA] Verified:', response),
    });

    window.recaptchaVerifier = verifier;
    verifier.render().catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendOTP = async () => {
    if (!isFormValid) return toast.error('Please complete all fields.');

    try {
      await window.recaptchaVerifier.verify();
      const confirmation = await signInWithPhoneNumber(auth, `+91${formData.phone}`, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      toast.success('OTP sent!');
    } catch (error: any) {
      toast.error('OTP failed', { description: error.message });
    }
  };

  const handleVerifyAndSubmit = async () => {
    if (!confirmationResult) return;

    setSubmitting(true);
    try {
      await confirmationResult.confirm(formData.otp);

      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      setSubmitted(true);
      toast.success('Message sent!');
    } catch (error: any) {
      toast.error('Failed to submit', { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Theme variant={theme || 'white'}>
        <div className="py-16 text-center">
          <Title>{successMessage || '🎉 Thanks for contacting us!'}</Title>
        </div>
      </Theme>
    );
  }

  return (
    <Theme variant={theme || 'white'}>
      <div className="py-16 max-w-2xl mx-auto">
        {tagLine && <Subtitle>{tagLine}</Subtitle>}
        {title && <Title>{title}</Title>}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <Input name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} disabled={otpSent} />
            <Input name="email" placeholder="Email" value={formData.email} onChange={handleChange} disabled={otpSent} />
            <Input
              name="phone"
              placeholder="Phone (10-digit)"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                }))
              }
              disabled={otpSent}
            />
            <Textarea name="message" rows={4} placeholder="Your message..." value={formData.message} onChange={handleChange} disabled={otpSent} />

            {!otpSent ? (
              <Button onClick={handleSendOTP} disabled={!isFormValid} fullWidth>
                Send OTP
              </Button>
            ) : (
              <>
                <Input name="otp" placeholder="Enter OTP" value={formData.otp} onChange={handleChange} />
                <Button onClick={handleVerifyAndSubmit} disabled={submitting} fullWidth>
                  {submitting ? 'Submitting...' : 'Verify & Submit'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
        <div id="recaptcha-contact-form" className="hidden" />
      </div>
    </Theme>
  );
}