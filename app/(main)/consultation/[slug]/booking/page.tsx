'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { saveUserInfo } from '@/lib/cookies'

export default function BookingFormPage() {
  const router = useRouter()
  const { slug } = useParams() as { slug: string }

  const [parentName, setParentName] = useState('')
  const [patientName, setPatientName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [confirmationResult, setConfirmationResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isPhoneValid = /^[0-9]{10}$/.test(phone)

  const validateInputs = () => {
    const errors: Record<string, string> = {}
    if (!parentName.trim()) errors.parentName = 'Parent name is required'
    if (!patientName.trim()) errors.patientName = 'Patient name is required'
    if (!email.trim()) errors.email = 'Email is required'
    else if (!isEmailValid) errors.email = 'Invalid email format'
    if (!isPhoneValid) errors.phone = 'Phone must be 10 digits'
    return errors
  }

  const handleSendOTP = async () => {
    const errors = validateInputs()
    if (Object.keys(errors).length) {
      toast.error(Object.values(errors)[0])
      return
    }

    setLoading(true)
    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' })
      const confirmation = await signInWithPhoneNumber(auth, `+91${phone}`, verifier)
      setConfirmationResult(confirmation)
      setOtpSent(true)
      toast.success(`OTP sent to +91${phone}`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to send OTP. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!confirmationResult) return
    setLoading(true)

    try {
      await confirmationResult.confirm(otp)
      saveUserInfo({ parentName, patientName, email, phone: `+91${phone}` })
      toast.success('Phone verified ✅')
      router.push(`/consultation/${slug}/calendar`)
    } catch (error) {
      console.error(error)
      toast.error('Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetPhone = () => {
    setOtpSent(false)
    setPhone('')
    setOtp('')
    setConfirmationResult(null)
  }

  const renderStatusIcon = (valid: boolean) => (
    <span className="absolute top-1/2 right-3 transform -translate-y-1/2 pointer-events-none">
      {valid ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <AlertCircle className="h-4 w-4 text-red-500" />
      )}
    </span>
  )

  if (!slug) {
    return <p className="text-destructive">Error: No doctor slug provided</p>
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Book a Consultation with {slug}</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Parent Name */}
          <div className="relative">
            <Label htmlFor="parentName">Parent's Name</Label>
            <div className="relative">
              <Input
                id="parentName"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                disabled={otpSent}
                placeholder="Enter your name"
              />
              {parentName && !otpSent && renderStatusIcon(!!parentName.trim())}
            </div>
          </div>

          {/* Patient Name */}
          <div className="relative">
            <Label htmlFor="patientName">Child's Name</Label>
            <div className="relative">
              <Input
                id="patientName"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                disabled={otpSent}
                placeholder="Enter child’s name"
              />
              {patientName && !otpSent && renderStatusIcon(!!patientName.trim())}
            </div>
          </div>

          {/* Email */}
          <div className="relative">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={otpSent}
                placeholder="Enter your email"
              />
              {email && !otpSent && renderStatusIcon(isEmailValid)}
            </div>
          </div>

            {/* Phone & OTP Section */}
            <div className="space-y-2 pt-2">
            <Label htmlFor="phone">Phone Number</Label>

            <div className="relative flex items-center border border-input rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-ring">
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
                {otpSent && (
                <Button type="button" variant="ghost" size="sm" onClick={resetPhone}>
                    Edit
                </Button>
                )}
            </div>

            {!isPhoneValid && phone && (
                <p className="text-sm text-destructive">Enter a valid 10-digit mobile number</p>
            )}
            </div>

          {/* OTP Section */}
          {!otpSent ? (
            <Button onClick={handleSendOTP} disabled={loading} className="w-full">
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </Button>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                OTP sent to <span className="font-semibold">+91{phone}</span>
              </p>
              <Input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <Button onClick={handleVerifyOTP} disabled={loading} className="w-full">
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <div id="recaptcha-container" className="mt-4" />
    </div>
  )
}