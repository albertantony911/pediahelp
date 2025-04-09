'use client';

import { useEffect, useState } from 'react';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Cookies from 'js-cookie';
import { toast } from 'sonner';
import clsx from 'clsx';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { CheckCircle2, AlertCircle, Star } from 'lucide-react';

// Validation component for form fields
const ValidatedField = ({ children, isValid }: { children: React.ReactNode; isValid: boolean }) => (
  <div className="relative">
    {children}
    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
      {isValid ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <AlertCircle className="h-4 w-4 text-red-500" />
      )}
    </span>
  </div>
);

interface ReviewFormProps {
  doctorId: string;
}

export default function ReviewForm({ doctorId }: ReviewFormProps) {
  // State management
  const [formData, setFormData] = useState({
    name: '',
    rating: 5,
    comment: '',
    phone: '',
    otp: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null); // Still using any here, will address later
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Validation logic
  const isPhoneValid = /^\d{10}$/.test(formData.phone);
  const isNameValid = formData.name.trim().length > 0;
  const isCommentValid = formData.comment.trim().length > 0;
  const isFormValid = isNameValid && isPhoneValid && isCommentValid && formData.rating;

  // Effect for reCAPTCHA and form data persistence
  useEffect(() => {
    if (typeof window === 'undefined') return;

    console.log('[reCAPTCHA] Initializing reCAPTCHA verifier...');
    console.log('[Firebase ENV] API Key:', process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

    // Clean up existing reCAPTCHA verifier
    if (window.recaptchaVerifier) {
      console.log('[reCAPTCHA] Clearing existing verifier...');
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = undefined;
    }

    const container = document.getElementById('recaptcha-review-container');
    if (container) container.innerHTML = '';

    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-review-container', {
        size: 'invisible',
        callback: (response: string) => { // Explicitly typing response as string
          console.log('[reCAPTCHA] Verified:', response);
        },
        'expired-callback': () => {
          console.log('[reCAPTCHA] Token expired');
        },
      });

      window.recaptchaVerifier = verifier;

      verifier.render().then((widgetId) => {
        console.log('[reCAPTCHA] Rendered with widget ID:', widgetId);
      }).catch((error) => {
        console.error('[reCAPTCHA] Render error:', error);
      });

    } catch (error) {
      console.error('[reCAPTCHA] Initialization error:', error);
    }

    // Restore cookie
    const saved = Cookies.get('pedia_review_info');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          name: parsed.name || '',
          comment: parsed.comment || '',
          rating: parsed.rating || 5,
        }));
        console.log('[Cookie] Restored saved review data.');
      } catch (error) {
        console.error('[Cookie] Error parsing saved review data:', error);
      }
    }

    return () => {
      if (window.recaptchaVerifier) {
        console.log('[reCAPTCHA] Cleanup on unmount.');
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle rating change
  const handleRatingChange = (value: number) => {
    if (!otpSent) {
      setFormData((prev) => ({ ...prev, rating: value }));
    }
  };

  // Send OTP to user's phone
  const handleSendOTP = async () => {
    if (!isFormValid) {
      toast.error('Please fill all fields before sending OTP.');
      console.warn('[OTP] Form validation failed:', formData);
      return;
    }

    try {
      console.log('[OTP] Attempting to verify reCAPTCHA...');
      if (window.recaptchaVerifier) {
        await window.recaptchaVerifier.verify();
      } else {
        console.error('[OTP] reCAPTCHA verifier missing!');
        return;
      }

      console.log('[OTP] Sending OTP to:', `+91${formData.phone}`);
      const confirmation = await signInWithPhoneNumber(auth, `+91${formData.phone}`, window.recaptchaVerifier);
      console.log('[OTP] ConfirmationResult:', confirmation);

      setConfirmationResult(confirmation);
      setOtpSent(true);
      toast.success(`OTP sent successfully to +91${formData.phone}`);
    } catch (error: any) {
      console.error('[OTP] Failed to send OTP:', error?.code, error?.message);
      toast.error('Failed to send OTP', {
        description: error?.message || 'Unexpected error',
      });
    }
  };

  // Verify OTP and submit review
  const handleVerifyAndSubmit = async () => {
    if (!confirmationResult) return;

    setSubmitting(true);
    try {
      await confirmationResult.confirm(formData.otp);

      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          rating: formData.rating,
          comment: formData.comment,
          doctorId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit review');
      }

      Cookies.set('pedia_review_info', JSON.stringify({
        name: formData.name,
        rating: formData.rating,
        comment: formData.comment,
      }), { expires: 7 });
      toast.success('Review submitted successfully!');
      setSubmitted(true);
    } catch (error: any) {
      toast.error('Failed to verify or submit', { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Render success message if submitted
  if (submitted) {
    return (
      <div className="mt-12 border-t pt-6 text-center">
        <h3 className="text-xl font-semibold text-green-600">🎉 Thank you for your review!</h3>
        <p className="text-muted-foreground text-sm mt-2">
          Your feedback helps others find the right pediatrician.
        </p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Refresh Page
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-12 max-w-xl border-t pt-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Leave a Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Name Field */}
          <div>
            <Label htmlFor="name">Your Name</Label>
            <ValidatedField isValid={isNameValid}>
              <Input
                id="name"
                name="name"
                placeholder="Your full name"
                value={formData.name}
                onChange={handleChange}
                disabled={otpSent}
                className="pr-10"
              />
            </ValidatedField>
          </div>

          {/* Rating Field */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="rating">Rating</Label>
            <TooltipProvider>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((val) => (
                  <Tooltip key={val}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => handleRatingChange(val)}
                        className={clsx(
                          'transition-transform duration-150 ease-in-out',
                          'hover:scale-110 focus:scale-110',
                          'disabled:cursor-not-allowed',
                          otpSent && 'cursor-not-allowed opacity-50'
                        )}
                        aria-label={`Rate ${val} star${val > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={clsx(
                            'h-6 w-6 stroke-2 transition-colors',
                            val <= formData.rating
                              ? 'fill-yellow-400 stroke-yellow-500'
                              : 'fill-transparent stroke-gray-300 hover:stroke-yellow-400'
                          )}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">{val} star{val > 1 ? 's' : ''}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </div>

          {/* Comment Field */}
          <div>
            <Label htmlFor="comment">Comment</Label>
            <ValidatedField isValid={isCommentValid}>
              <Textarea
                id="comment"
                name="comment"
                placeholder="Write your feedback..."
                rows={4}
                value={formData.comment}
                onChange={handleChange}
                disabled={otpSent}
                className="pr-10"
              />
            </ValidatedField>
          </div>

          {/* Phone Field */}
          <div>
            <Label htmlFor="phone">Mobile Number</Label>
            <ValidatedField isValid={isPhoneValid}>
              <div className="flex items-center border border-input rounded-md overflow-hidden bg-background">
                <div className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 text-sm gap-1 shrink-0 text-gray-700">
                  🇮🇳 +91
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                  }))}
                  disabled={otpSent}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full px-3 py-2 bg-transparent outline-none text-sm"
                />
              </div>
            </ValidatedField>
          </div>

          {/* OTP and Submit Buttons */}
          {!otpSent ? (
            <Button onClick={handleSendOTP} disabled={!isFormValid} className="w-full">
              Send OTP
            </Button>
          ) : (
            <>
              <Input
                id="otp"
                name="otp"
                placeholder="Enter OTP"
                value={formData.otp}
                onChange={handleChange}
                maxLength={6}
                inputMode="numeric"
              />
              <Button onClick={handleVerifyAndSubmit} disabled={submitting} className="w-full">
                {submitting ? 'Submitting...' : 'Verify & Submit Review'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
      <div id="recaptcha-review-container" className="hidden" style={{ touchAction: 'none' }} />
    </div>
  );
}