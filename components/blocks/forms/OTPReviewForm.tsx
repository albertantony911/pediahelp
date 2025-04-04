'use client'

import { useState, useRef, useEffect } from 'react'
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
  const [confirmationResult, setConfirmationResult] = useState<any>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const recaptchaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.recaptchaVerifier) {
      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        })
        verifier.render().catch((err) => {
          console.error('reCAPTCHA render error:', err)
        })
        window.recaptchaVerifier = verifier
      } catch (error) {
        console.error('Failed to initialize reCAPTCHA:', error)
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
    if (!phone.startsWith('+91') || phone.length !== 13) {
      toast.error('Invalid phone number', {
        description: 'Make sure it starts with +91 and has 10 digits.',
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
        description: 'Check your phone for the OTP.',
      })
    } catch (error) {
      console.error(error)
      toast.error('Failed to send OTP', {
        description: 'Try again or check the phone number.',
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
    } catch (error) {
      console.error('OTP verification failed:', error)
      toast.error('Invalid OTP', {
        description: 'Please try again.',
      })
    }
  }

  const handleSubmitReview = async () => {
    if (!name.trim()) {
      toast.warning('Name required', {
        description: 'Please enter your name.',
      })
      return
    }

    if (!comment.trim()) {
      toast.warning('Comment required', {
        description: 'Please write something before submitting.',
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

      if (res.ok) {
        setSubmitted(true)
        setComment('')
        setName('')
        toast.success('Review submitted!')
        window.location.reload()
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Submission error')
      }
    } catch (error) {
      console.error('Submit error:', error)
      toast.error('Submission failed', {
        description: 'Please try again.',
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
              <option key={r} value={r}>
                {r} Stars
              </option>
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