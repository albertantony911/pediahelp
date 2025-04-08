'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation'; // Replace useSearchParams with useParams
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { saveUserInfo } from '@/lib/cookies';


export default function BookingFormPage() {
  const router = useRouter();
  const params = useParams(); // Get dynamic route parameters
  const slug = params.slug as string; // Extract the slug from the path
  console.log('Slug:', slug);

  const [parentName, setParentName] = useState('');
  const [patientName, setPatientName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPhoneValid = /^[0-9]{10}$/.test(phone);

  const validateInputs = () => {
    const errors: { [key: string]: string } = {};

    if (!parentName.trim()) errors.parentName = 'Parent name is required';
    if (!patientName.trim()) errors.patientName = 'Patient name is required';
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!isEmailValid) {
      errors.email = 'Enter a valid email address';
    }
    if (!isPhoneValid) errors.phone = 'Enter a valid 10-digit number';

    return errors;
  };

  const handleSendOTP = async () => {
    const errors = validateInputs();
    if (Object.keys(errors).length > 0) {
      toast.error(Object.values(errors)[0]);
      return;
    }

    setLoading(true);
    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });

      const confirmation = await signInWithPhoneNumber(auth, `+91${phone}`, verifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      toast.success(`OTP sent to +91${phone}`);
    } catch (error) {
      console.error('OTP send error:', error);
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!confirmationResult) return;

    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      toast.success('Phone verified ✅');

      // Save info to cookie
      saveUserInfo({ parentName, patientName, email, phone: `+91${phone}` });

      // Redirect to calendar page
      router.push(`/consultation/${slug}/calendar`);
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPhone = () => {
    setOtpSent(false);
    setPhone('');
    setOtp('');
    setConfirmationResult(null);
  };

  const renderStatusIcon = (valid: boolean) => (
    <span className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none">
      {valid ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <AlertCircle className="h-4 w-4 text-red-500" />
      )}
    </span>
  );

  // Add a check for missing slug
  if (!slug) {
    return <div className="text-red-500">Error: No doctor slug provided</div>;
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-2xl font-semibold">Book a Consultation with {slug}</h1>

      <div className="space-y-4">
        {/* Parent Name */}
        <div className="relative">
          <Input
            placeholder="Parent's Name"
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            disabled={otpSent}
          />
          {parentName && !otpSent && renderStatusIcon(!!parentName.trim())}
        </div>

        {/* Patient Name */}
        <div className="relative">
          <Input
            placeholder="Patient's Name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            disabled={otpSent}
          />
          {patientName && !otpSent && renderStatusIcon(!!patientName.trim())}
        </div>

        {/* Email Field */}
        <div className="relative">
          <Input
            type="email"
            placeholder="Email ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={otpSent}
          />
          {email && !otpSent && renderStatusIcon(isEmailValid)}
        </div>

        {/* Phone & OTP */}
        <div className="space-y-3 pt-4">
          <div className="relative">
            <div className="flex items-center border border-input rounded-md overflow-hidden">
              <div className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 text-sm gap-1 shrink-0">
                🇮🇳 +91
              </div>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit mobile number"
                disabled={otpSent}
                className="w-full px-3 py-2 outline-none bg-transparent"
              />
              {otpSent && (
                <Button size="sm" variant="ghost" onClick={resetPhone}>
                  Edit
                </Button>
              )}
            </div>
            {!isPhoneValid && phone && (
              <p className="text-red-500 text-sm mt-1">Enter a valid 10-digit mobile number</p>
            )}
          </div>

          {!otpSent ? (
            <Button onClick={handleSendOTP} disabled={loading}>
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                OTP sent to <span className="font-medium">+91{phone}</span>
              </p>
              <Input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <Button onClick={handleVerifyOTP} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div id="recaptcha-container" />
    </div>
  );
}