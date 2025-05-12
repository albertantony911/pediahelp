'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { client as sanityClient } from '@/sanity/lib/client'; // ✅ new import
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { motion, AnimatePresence } from 'framer-motion';

export default function BookingFormPage() {
  const { slug } = useParams() as { slug: string };

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [appointmentInfo, setAppointmentInfo] = useState<{ date: string; time: string } | null>(null);
  const [parentName, setParentName] = useState('');
  const [patientName, setPatientName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [bookingToken] = useState(() => nanoid());

  const [zcalLink, setZcalLink] = useState<string | null>(null); // ✅ unchanged
  const [isZcalLoading, setIsZcalLoading] = useState(true); // ✅ added for UX

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPhoneValid = /^[0-9]{10}$/.test(phone);

  // ✅ Fetch bookingId (Zcal Link) from Sanity
  useEffect(() => {
    const fetchZcalLink = async () => {
      try {
        const result = await sanityClient.fetch(
          `*[_type == "doctor" && slug.current == $slug][0]{ bookingId }`,
          { slug }
        );
        if (result?.bookingId) {
          setZcalLink(result.bookingId);
        } else {
          console.warn('No Zcal booking link found for slug:', slug);
          toast.error('No booking link available for this doctor.');
          setIsZcalLoading(false);
        }
      } catch (err) {
        console.error('Error fetching Zcal link from Sanity:', err);
        toast.error('Failed to load booking calendar.');
        setIsZcalLoading(false);
      }
    };

    fetchZcalLink();
  }, [slug]);

  const validateInputs = () => {
    const errors: Record<string, string> = {};
    if (!parentName.trim()) errors.parentName = 'Parent name is required';
    if (!patientName.trim()) errors.patientName = 'Patient name is required';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!isEmailValid) errors.email = 'Invalid email format';
    if (!isPhoneValid) errors.phone = 'Phone must be 10 digits';
    return errors;
  };

  const handleSendOTP = async () => {
    const errors = validateInputs();
    if (Object.keys(errors).length) {
      toast.error(Object.values(errors)[0]);
      return;
    }

    setLoading(true);
    try {
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      const confirmation = await signInWithPhoneNumber(auth, `+91${phone}`, verifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      toast.success(`OTP sent to +91${phone}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!confirmationResult) return;
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      setOtpVerified(true);
      setStep(3);
      toast.success('Phone verified ✅');
    } catch (error) {
      console.error(error);
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      const response = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingToken,
          name: parentName,
          email,
          phone: `+91${phone}`,
          amount: 150000, // ₹1500 in paise
        }),
      });

      const data = await response.json();

      if (!data.orderId) {
        toast.error('Failed to create Razorpay order');
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: 'PediaHelp',
        description: 'Doctor Appointment Booking',
        order_id: data.orderId,
        prefill: {
          name: parentName,
          email,
          contact: `+91${phone}`,
        },
        notes: {
          bookingToken,
        },
        theme: {
          color: '#264E5B',
        },
        handler: function (response: any) {
          toast.success('Payment successful!');
        },
        modal: {
          ondismiss: function () {
            toast.info('Payment popup closed');
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error(error);
      toast.error('Payment failed to initialize');
    }
  };

  const initZCalEmbed = () => {
    if (!zcalLink) {
      console.warn('Zcal link not available');
      setIsZcalLoading(false);
      return;
    }

    // Check if script is already loaded
    if (document.querySelector('script[src="https://static.zcal.co/embed/v1/embed.js"]')) {
      if (typeof (window as any).zcal === 'function') {
        (window as any).zcal('init', {
          element: '#zcal-embed',
          link: zcalLink, // ✅ Use dynamic zcalLink
          theme: 'light',
          metadata: { doctorSlug: slug, bookingToken },
          onEventScheduled: (event: any) => {
            console.log('Zcal event scheduled:', event); // ✅ Debug log
            setAppointmentInfo({
              date: event.startTime ? new Date(event.startTime).toLocaleDateString() : 'N/A',
              time: event.startTime ? new Date(event.startTime).toLocaleTimeString() : 'N/A',
            });
            setStep(2);
          },
        });
        setIsZcalLoading(false);
      }
      return;
    }

    // Load Zcal script
    const script = document.createElement('script');
    script.src = 'https://static.zcal.co/embed/v1/embed.js'; // ✅ Updated to correct URL
    script.async = true;
    script.onerror = () => {
      console.error('Failed to load Zcal script');
      toast.error('Failed to load booking calendar.');
      setIsZcalLoading(false);
    };
    script.onload = () => {
      if (typeof (window as any).zcal === 'function') {
        (window as any).zcal('init', {
          element: '#zcal-embed',
          link: zcalLink,
          theme: 'light',
          metadata: { doctorSlug: slug, bookingToken },
          onEventScheduled: (event: any) => {
            console.log('Zcal event scheduled:', event);
            setAppointmentInfo({
              date: event.startTime ? new Date(event.startTime).toLocaleDateString() : 'N/A',
              time: event.startTime ? new Date(event.startTime).toLocaleTimeString() : 'N/A',
            });
            setStep(2);
          },
        });
        setIsZcalLoading(false);
      } else {
        console.error('Zcal function not available after script load');
        toast.error('Failed to initialize booking calendar.');
        setIsZcalLoading(false);
      }
    };
    document.body.appendChild(script);

    // Cleanup
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      const zcalWidget = document.querySelector('#zcal-embed iframe');
      if (zcalWidget && zcalWidget.parentNode) {
        zcalWidget.parentNode.removeChild(zcalWidget);
      }
    };
  };

  useEffect(() => {
    if (step !== 1 || !zcalLink) {
      setIsZcalLoading(false);
      return;
    }
    return initZCalEmbed();
  }, [step, zcalLink]);

  const renderStep1 = () => (
    <motion.div
      key="step-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-xl font-semibold mb-4">Select an Appointment Time</h2>
      {!zcalLink && (
        <p className="text-red-500">Booking calendar not available. Please try again later.</p>
      )}
      {isZcalLoading && zcalLink && <p>Loading booking calendar...</p>}
      <div
        id="zcal-embed"
        className="mb-6"
        style={{ minHeight: '600px', width: '100%', maxWidth: '800px', margin: '0 auto' }}
      />
      {zcalLink && !isZcalLoading && (
        <p className="text-sm mt-2 text-center">
          Having trouble?{' '}
          <a href={zcalLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
            Book directly on Zcal
          </a>
        </p>
      )}
    </motion.div>
  );

  const renderStep2 = () => (
  <motion.div
    key="step-2"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Enter Your Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="parentName">Parent's Name</Label>
          <Input id="parentName" value={parentName} onChange={(e) => setParentName(e.target.value)} disabled={otpSent} />
        </div>

        <div>
          <Label htmlFor="patientName">Child's Name</Label>
          <Input id="patientName" value={patientName} onChange={(e) => setPatientName(e.target.value)} disabled={otpSent} />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={otpSent} />
        </div>

        <div>
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            disabled={otpSent}
          />
        </div>

        {!otpSent ? (
          <Button onClick={handleSendOTP} disabled={loading} className="w-full">
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </Button>
        ) : (
          <>
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
  </motion.div>
);


  const renderStep3 = () => (
  <motion.div
    key="step-3"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Confirm & Pay</CardTitle>
      </CardHeader>
      <CardContent>
        <p><strong>Doctor:</strong> {slug}</p>
        <p><strong>Date:</strong> {appointmentInfo?.date}</p>
        <p><strong>Time:</strong> {appointmentInfo?.time}</p>
        <p><strong>Parent:</strong> {parentName}</p>
        <p><strong>Child:</strong> {patientName}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Phone:</strong> +91{phone}</p>
        <Button onClick={handlePayment} className="mt-4 w-full">
          Proceed to Payment
        </Button>
      </CardContent>
    </Card>
  </motion.div>
);


  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Progress value={(step / 3) * 100} className="h-2" />
        <div className="flex justify-between text-sm mt-2">
          <span className={step >= 1 ? 'font-bold' : ''}>1. Select Time</span>
          <span className={step >= 2 ? 'font-bold' : ''}>2. Details</span>
          <span className={step === 3 ? 'font-bold' : ''}>3. Confirm & Pay</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </AnimatePresence>

      <div id="recaptcha-container" className="mt-4" />
    </div>
  );
}