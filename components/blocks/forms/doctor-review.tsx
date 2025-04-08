'use client'

import { useEffect, useState } from 'react'
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import clsx from 'clsx'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import { CheckCircle2, AlertCircle, Star } from 'lucide-react'

interface Props {
  doctorId: string
}

function ValidatedField({
  children,
  isValid,
}: {
  children: React.ReactNode
  isValid: boolean
}) {
  return (
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
  )
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
    if (typeof window !== 'undefined') {
      if (window.recaptchaVerifier?.clear) {
        window.recaptchaVerifier.clear()
        window.recaptchaVerifier = undefined
        document.getElementById('recaptcha-review-container')?.replaceChildren()
      }

      try {
        const verifier = new RecaptchaVerifier(auth, 'recaptcha-review-container', {
          size: 'invisible',
          callback: () => {},
        })
        window.recaptchaVerifier = verifier
        verifier.render()
      } catch (e) {
        console.error('reCAPTCHA error:', e)
      }
    }

    const saved = Cookies.get('pedia_review_info')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setName(parsed.name || '')
        setComment(parsed.comment || '')
        setRating(parsed.rating || 5)
      } catch {}
    }
  }, [])

  const handleSendOTP = async () => {
    if (!isReadyToSendOtp) {
      toast.error('Please fill all fields before sending OTP.')
      return
    }

    try {
      const confirmation = await signInWithPhoneNumber(auth, `+91${phone}`, window.recaptchaVerifier)
      setConfirmationResult(confirmation)
      setOtpSent(true)
      toast.success('OTP sent successfully to +91' + phone)
    } catch (err: any) {
      toast.error('Failed to send OTP', { description: err?.message })
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

      if (!res.ok) throw new Error((await res.json())?.error || 'Failed to submit review')

      Cookies.set('pedia_review_info', JSON.stringify({ name, rating, comment }), { expires: 7 })
      toast.success('Review submitted successfully!')
      setSubmitted(true)
    } catch (err: any) {
      toast.error('Failed to verify or submit', { description: err?.message })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="mt-12 border-t pt-6 text-center">
        <h3 className="text-xl font-semibold text-green-600">🎉 Thank you for your review!</h3>
        <p className="text-muted-foreground text-sm mt-2">
          Your feedback helps others find the right pediatrician.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-12 max-w-xl border-t pt-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Leave a Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Name */}
          <div>
            <Label>Your Name</Label>
            <ValidatedField isValid={isNameValid}>
              <Input
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={otpSent}
                className="pr-10"
              />
            </ValidatedField>
          </div>

          {/* Star Rating */}
          <div className='flex flex-col  gap-2'>
            <Label className="mb-1 block">Rating </Label>
            <TooltipProvider>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((val) => (
                  <Tooltip key={val}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => !otpSent && setRating(val)}
                        className={clsx(
                          'transition-transform duration-150 ease-in-out',
                          'hover:scale-110 focus:scale-110',
                          'disabled:cursor-not-allowed'
                        )}
                        aria-label={`Rate ${val} star${val > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={clsx(
                            'h-6 w-6 stroke-2 transition-colors',
                            val <= rating
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

          {/* Comment */}
          <div>
            <Label>Comment</Label>
            <ValidatedField isValid={isCommentValid}>
              <Textarea
                placeholder="Write your feedback..."
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={otpSent}
                className="pr-10"
              />
            </ValidatedField>
          </div>

          {/* Phone */}
          <div>
            <Label>Mobile Number</Label>
            <ValidatedField isValid={isPhoneValid}>
              <div className="flex items-center border border-input rounded-md overflow-hidden bg-background">
                <div className="flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-800 text-sm gap-1 shrink-0 text-gray-700">
                  🇮🇳 +91
                </div>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  disabled={otpSent}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full px-3 py-2 bg-transparent outline-none text-sm"
                />
              </div>
            </ValidatedField>
          </div>

          {/* OTP Input + Submit */}
          {!otpSent ? (
            <Button onClick={handleSendOTP} disabled={!isReadyToSendOtp} className="w-full">
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
              />
              <Button onClick={handleVerifyOTP} disabled={submitting} className="w-full">
                {submitting ? 'Submitting...' : 'Verify & Submit Review'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <div id="recaptcha-review-container" className="mt-4" />
    </div>
  )
}