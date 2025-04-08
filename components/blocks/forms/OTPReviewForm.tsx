'use client'

import { useState, useEffect, useRef } from 'react'
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { toast } from 'sonner'

interface Props {
  doctorId: string
}

export default function OTPReviewForm({ doctorId }: Props) {
  const [step, setStep] = useState<'start' | 'otp' | 'verified'>('start')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<any>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const recaptchaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: (response: any) => {
            console.log('reCAPTCHA solved', response)
          },
        })
        verifier.render().catch(console.error)
        window.recaptchaVerifier = verifier
      } catch (error) {
        console.error('reCAPTCHA init failed:', error)
      }
    }
    return () => {
      if (window.recaptchaVerifier?.clear) {
        window.recaptchaVerifier.clear()
        window.recaptchaVerifier = undefined
      }
    }
  }, [])

  const handleSendOTP = async () => {
    if (!/^\+91\d{10}$/.test(phone)) {
      toast.error('Invalid phone number', {
        description: 'Must start with +91 followed by 10 digits.',
      })
      return
    }

    try {
      const verifier = window.recaptchaVerifier
      if (!verifier) throw new Error('reCAPTCHA verifier missing')

      const confirmation = await signInWithPhoneNumber(auth, phone, verifier)
      setConfirmationResult(confirmation)
      setStep('otp')
      toast.success('OTP sent!', {
        description: 'Check your phone.',
      })
    } catch (error: any) {
      console.error('OTP send error:', error.code, error.message)
      toast.error('Failed to send OTP', {
        description: error?.message || 'Check number and try again.',
      })
    }
  }

  const handleVerifyOTP = async () => {
    try {
      await confirmationResult.confirm(otp)
      setStep('verified')
      toast.success('OTP verified!', {
        description: 'You can now submit your review.',
      })
    } catch (error: any) {
      console.error('OTP verification error:', error.code, error.message)
      toast.error('Invalid OTP', {
        description: error?.message || 'Try again.',
      })
    }
  }

  const handleSubmitReview = async () => {
    if (!name.trim() || !comment.trim()) {
      toast.warning('Missing fields', {
        description: !name.trim()
          ? 'Please enter your name.'
          : 'Please enter your comment.',
      })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rating, comment, doctorId }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Submission failed')
      }

      setSubmitted(true)
      setName('')
      setComment('')
      toast.success('Review submitted!')
      window.location.reload()
    } catch (error: any) {
      console.error('Review submit error:', error.message)
      toast.error('Submission failed', {
        description: error?.message || 'Try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-12 border-t pt-6">
      <h3 className="text-lg font-semibold mb-4">Leave a Review</h3>

      {step === 'start' && (
        <div className="space-y-3">
          <input
            type="tel"
            placeholder="+91XXXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded p-2"
          />
          <button
            onClick={handleSendOTP}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Send OTP
          </button>
        </div>
      )}

      {step === 'otp' && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full border rounded p-2"
          />
          <button
            onClick={handleVerifyOTP}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Verify OTP
          </button>
        </div>
      )}

      {step === 'verified' && !submitted && (
        <div className="space-y-3">
          <label className="block text-sm font-medium">Your Name:</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded p-2"
          />

          <label className="block text-sm font-medium">Rating:</label>
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="border rounded px-2 py-1"
          >
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>{r} Stars</option>
            ))}
          </select>

          <textarea
            className="w-full border rounded p-2"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write your review..."
          />

          <button
            onClick={handleSubmitReview}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      )}

      {submitted && (
        <p className="text-green-600 mt-3 text-sm">🎉 Thanks for your review!</p>
      )}

      <div id="recaptcha-container" ref={recaptchaRef}></div>
    </div>
  )
}
