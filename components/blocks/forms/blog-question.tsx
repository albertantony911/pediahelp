'use client';

import { useState, useEffect } from 'react';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from 'sonner';
import clsx from 'clsx';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Mail, Phone, MessageSquareText } from 'lucide-react';

interface BlogQuestionFormProps {
  slug: string;         // blog post slug
  blogTitle: string;    // optional: used in WhatsApp link
}

export default function BlogQuestionForm({ slug, blogTitle }: BlogQuestionFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    question: '',
    otp: '',
  });

  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // VALIDATION
  const isPhoneValid = /^\d{10}$/.test(formData.phone);
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const isNameValid = formData.name.trim().length > 0;
  const isQuestionValid = formData.question.trim().length > 5;
  const isFormValid = isPhoneValid && isEmailValid && isNameValid && isQuestionValid;

  // SETUP: Firebase reCAPTCHA
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = undefined;
    }

    const container = document.getElementById('recaptcha-blog-question');
    if (container) container.innerHTML = '';

    const verifier = new RecaptchaVerifier(auth, 'recaptcha-blog-question', {
      size: 'invisible',
      callback: (response: string) => console.log('[reCAPTCHA] Verified:', response),
      'expired-callback': () => console.log('[reCAPTCHA] Token expired'),
    });

    window.recaptchaVerifier = verifier;
    verifier.render().catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendOTP = async () => {
    if (!isFormValid) return toast.error('Please fill all fields correctly before sending OTP.');

    try {
      await window.recaptchaVerifier.verify();
      const confirmation = await signInWithPhoneNumber(auth, `+91${formData.phone}`, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      toast.success('OTP sent to +91' + formData.phone);
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to send OTP', { description: error.message });
    }
  };

  const handleVerifyAndSubmit = async () => {
    if (!confirmationResult) return;

    setSubmitting(true);
    try {
      await confirmationResult.confirm(formData.otp);

      const res = await fetch('/api/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, slug }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to submit');
      }

      toast.success('Question submitted!');

      // Redirect to WhatsApp
      const message = encodeURIComponent(
        `Hi, I have a question about "${blogTitle}":\n\n${formData.question}\n\n- ${formData.name}`
      );
      const whatsappUrl = `https://wa.me/<+916282174585>?text=${message}`;
      window.location.href = whatsappUrl;

      setSubmitted(true);
    } catch (error: any) {
      toast.error('Submission failed', { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-12 border-t pt-6 text-center">
        <h3 className="text-xl font-semibold text-green-600">🎉 Thank you for your question!</h3>
        <p className="text-muted-foreground text-sm mt-2">
          We’ll get back to you shortly via WhatsApp or Email.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-12 max-w-xl border-t pt-6">
      <Card>
        <CardHeader>
          <CardTitle>Have a question about this blog?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field label="Your Name" icon={<CheckCircle2 />} isValid={isNameValid}>
            <Input name="name" value={formData.name} onChange={handleChange} disabled={otpSent} />
          </Field>

          <Field label="Email" icon={<Mail />} isValid={isEmailValid}>
            <Input name="email" value={formData.email} onChange={handleChange} disabled={otpSent} />
          </Field>

          <Field label="Phone Number" icon={<Phone />} isValid={isPhoneValid}>
            <Input
              name="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                }))
              }
              disabled={otpSent}
              placeholder="10-digit number"
            />
          </Field>

          <Field label="Your Question" icon={<MessageSquareText />} isValid={isQuestionValid}>
            <Textarea name="question" rows={4} value={formData.question} onChange={handleChange} disabled={otpSent} />
          </Field>

          {!otpSent ? (
            <Button onClick={handleSendOTP} disabled={!isFormValid} className="w-full">
              Send OTP
            </Button>
          ) : (
            <>
              <Input name="otp" placeholder="Enter OTP" value={formData.otp} onChange={handleChange} />
              <Button onClick={handleVerifyAndSubmit} disabled={submitting} className="w-full">
                {submitting ? 'Submitting...' : 'Verify & Submit'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <div id="recaptcha-blog-question" className="hidden" />
    </div>
  );
}

// ✅ Helper field wrapper
function Field({
  label,
  children,
  icon,
  isValid,
}: {
  label: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  isValid: boolean;
}) {
  return (
    <div>
      <Label className="mb-1 block">{label}</Label>
      <div className="relative">
        {children}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isValid ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-500" />
          )}
        </span>
      </div>
    </div>
  );
}