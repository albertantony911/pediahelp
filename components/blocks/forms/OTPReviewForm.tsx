'use client'

import { useEffect, useState } from 'react'
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Cookies from 'js-cookie'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  doctorId: string
}

export default function ReviewForm({ doctorId }: Props) {
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [confirmationResult, setConfirmationResult] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const isPhoneValid = /^\d{10}$/.test(phone)
  const isNameValid = name.trim().length > 0
  const isCommentValid = comment.trim().length > 0
  const isReadyToSendOtp = isNameValid && isPhoneValid && isCommentValid && rating

  useEffect(() => {
    const containerId = 'recaptcha-container'
    if (typeof window !== 'undefined') {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear()
          window.recaptchaVerifier = undefined
          document.getElementById(containerId)?.replaceChildren()
        } catch (e) {
          console.warn('Cleanup error:', e)
        }
      }

      try {
        const verifier = new RecaptchaVerifier(auth, containerId, {
          size: 'invisible',
          callback: (response: any) => console.log('CAPTCHA solved:', response),
        })
        window.recaptchaVerifier = verifier
        verifier.render()
      } catch (error) {
        console.error('Failed to initialize reCAPTCHA:', error)
      }
    }

    // Load from cookie
    const saved = Cookies.get('pedia_review_info')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setName(parsed.name || '')
        setComment(parsed.comment || '')
        setRating(parsed.rating || 5)
      } catch {}
    }

    return () => {
      if (window.recaptchaVerifier?.clear) {
        window.recaptchaVerifier.clear()
        window.recaptchaVerifier = undefined
      }
    }
  }, [])

  const handleSendOTP = async () => {
    if (!isReadyToSendOtp) {
      toast.error('Please fill in all fields before sending OTP.')
      return
    }

    try {
      const verifier = window.recaptchaVerifier
      if (!verifier) throw new Error('reCAPTCHA verifier missing')

      const confirmation = await signInWithPhoneNumber(auth, `+91${phone}`, verifier)
      setConfirmationResult(confirmation)
      setOtpSent(true)
      toast.success('OTP sent!', {
        description: `Sent to +91${phone}`,
      })
    } catch (error: any) {
      console.error('OTP send error:', error.code, error.message)
      toast.error('Failed to send OTP', {
        description: error?.message || 'Try again later.',
      })
    }
  }

  const handleVerifyOTP = async () => {
    if (!confirmationResult) return

    setSubmitting(true)
    try {
      await confirmationResult.confirm(otp)

      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rating, comment, doctorId }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Submission failed')
      }

      // Save to cookie for reuse
      Cookies.set('pedia_review_info', JSON.stringify({ name, rating, comment }), { expires: 7 })

      toast.success('Review submitted!')
      setSubmitted(true)
    } catch (error: any) {
      console.error('OTP or submission error:', error.code || error.message)
      toast.error('Failed to verify or submit', {
        description: error?.message || 'Try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const renderStatusIcon = (valid: boolean) => (
    <span className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none">
      {valid ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <AlertCircle className="h-4 w-4 text-red-500" />
      )}
    </span>
  )

  if (submitted) {
    return (
      <div className="mt-12 border-t pt-6 text-center">
        <h3 className="text-xl font-semibold text-green-600">🎉 Thank you for your review!</h3>
        <p className="text-muted-foreground text-sm mt-2">Your feedback helps others find the right pediatrician.</p>
      </div>
    )
  }

  return (
    <div className="mt-12 border-t pt-6 max-w-xl">
      <h3 className="text-lg font-semibold mb-4">Leave a Review</h3>

      <div className="space-y-4">
        <label className="block text-sm font-medium">Your Name</label>
        <div className="relative">
          <Input
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={otpSent}
            aria-label="Your Name"
          />
          {name && !otpSent && renderStatusIcon(isNameValid)}
        </div>

        <label className="block text-sm font-medium">Rating</label>
<Select value={String(rating)} onValueChange={(val) => setRating(Number(val))}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Select rating" />
  </SelectTrigger>
  <SelectContent>
    {[5, 4, 3, 2, 1].map((r) => (
      <SelectItem key={r} value={String(r)}>
        {r} Stars
      </SelectItem>
    ))}
  </SelectContent>
</Select>

        <label className="block text-sm font-medium">Your Comment</label>
        <div className="relative">
          <textarea
            placeholder="Write your comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={otpSent}
            className="w-full border rounded p-2"
            aria-label="Comment"
          />
          {comment && !otpSent && renderStatusIcon(isCommentValid)}
        </div>

        <label className="block text-sm font-medium">Phone Number</label>
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
              aria-label="Phone Number"
            />
          </div>
          {phone && !otpSent && renderStatusIcon(isPhoneValid)}
        </div>

        {!otpSent ? (
          <Button onClick={handleSendOTP} disabled={!isReadyToSendOtp}>
            Send OTP
          </Button>
        ) : (
          <>
            <Input
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              inputMode="numeric"
              aria-label="OTP"
            />
            <Button onClick={handleVerifyOTP} disabled={submitting}>
              {submitting ? 'Verifying...' : 'Verify & Submit Review'}
            </Button>
          </>
        )}
      </div>

      <div id="recaptcha-container" className="mt-4" />
    </div>
  )
}
