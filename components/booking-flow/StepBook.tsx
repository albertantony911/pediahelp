'use client';

import React, { useState, useEffect } from 'react';
import { format, isSameDay, addDays } from 'date-fns';
import { useBookingStore } from '@/store/bookingStore';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Script from 'next/script';
import { cn } from '@/lib/utils';

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

export default function StepBook() {
  const {
    selectedDoctor,
    selectedSlot,
    setSelectedSlot,
    setStep,
    patient,
    setPatient,
    confirmedBookingId,
    setConfirmedBookingId,
  } = useBookingStore();

  // Preselect date = today + 2 days for context
  const initialDate = addDays(new Date(), 2);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [allFetchedSlots, setAllFetchedSlots] = useState<string[]>([]);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const formattedDate = format(selectedDate, 'EEEE, MMMM d');
  const formattedTime = selectedSlot ? format(new Date(selectedSlot), 'h:mm a') : null;

  const photoUrl = selectedDoctor?.photo?.asset?.url || '/doctor-placeholder.jpg';

  useEffect(() => {
    const fetchAllSlots = async () => {
      if (!selectedDoctor?._id) return;
      try {
        const startDate = format(new Date(), 'yyyy-MM-dd');
        const endDate = format(addDays(new Date(), 30), 'yyyy-MM-dd');
        const res = await fetch(`/api/heimdall/slots?doctorId=${selectedDoctor._id}&startDate=${startDate}&endDate=${endDate}`);
        const data = await res.json();
        if (res.ok && data.slots) setAllFetchedSlots(data.slots);
        else toast.error('No slots available');
      } catch {
        toast.error('Failed to fetch slots');
      }
    };
    fetchAllSlots();
  }, [selectedDoctor]);

  useEffect(() => {
    const filtered = allFetchedSlots.filter((slot) => isSameDay(new Date(slot), selectedDate));
    setAvailableSlots(filtered);
  }, [selectedDate, allFetchedSlots]);

  const handleSlotSelect = (slot: string) => {
    const fullSlot = `${format(selectedDate, 'yyyy-MM-dd')}T${slot}:00`;
    setSelectedSlot(fullSlot);
  };

  const handleSendOtp = async () => {
    const { parentName, childName, phone, email } = patient;
    if (!parentName || !childName || !phone || !email || !selectedSlot || !selectedDoctor?._id) {
      toast.error('Fill all fields and select a slot');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/heimdall/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId: selectedDoctor._id, slot: selectedSlot, patient }),
      });
      const data = await res.json();
      if (res.ok && data.bookingId) {
        setConfirmedBookingId(data.bookingId);
        setOtpSent(true);
        toast.success('OTP sent');
      } else toast.error(data?.error || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmedBookingId || otp.length !== 6) return;
    setLoading(true);
    try {
      const res = await fetch('/api/heimdall/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: confirmedBookingId, otp }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('OTP Verified!');
        handlePay();
      } else toast.error('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!confirmedBookingId) return;
    const res = await fetch('/api/heimdall/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: confirmedBookingId })
    });
    const data = await res.json();
    if (!res.ok || !data.orderId) {
      toast.error(data?.error || 'Failed to initialize payment');
      return;
    }
    const razorpay = new (window as any).Razorpay({
      key: data.keyId,
      amount: data.amount,
      currency: 'INR',
      name: data.doctor.name,
      description: 'PediaHelp Appointment',
      order_id: data.orderId,
      handler: () => setStep(1),
      theme: { color: '#00B4D8' }
    });
    razorpay.open();
  };

  return (
    <div className="space-y-6">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <h2 className="text-xl font-semibold">Book an Appointment</h2>

      {/* Calendar */}
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && setSelectedDate(date)}
        weekStartsOn={1}
        // 🔒 Disable past & next 48h
        modifiers={{
          disabled: { before: addDays(new Date(), 2) },
        }}
        modifiersClassNames={{
          selected: 'bg-teal-100 text-dark-shade scale-[1.05] transition-all duration-300 ease-in-out',
          today: 'text-coral-600 font-semibold',
          disabled: 'text-gray-400 cursor-not-allowed bg-gray-50', // 👈 light gray disabled dates
        }}
        className="rounded-xl border border-gray-200 p-4 shadow-sm bg-white text-sm"
        components={{
          IconLeft: () => <ChevronLeft className="w-4 h-4 text-gray-500 hover:text-teal-600" />,
          IconRight: () => <ChevronRight className="w-4 h-4 text-gray-500 hover:text-teal-600" />,
        }}
        classNames={{
          caption: 'relative flex justify-center items-center font-semibold text-sm gap-2 mb-2',
          nav: 'flex justify-between w-full absolute top-1',
          nav_button: 'p-1',
        }}
        captionLayout="dropdown-buttons"
        aria-label="Appointment calendar"
      />

      {/* Time Slots */}
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
        {Array.from({ length: 16 }, (_, i) => {
          const time = `${(8 + i).toString().padStart(2, '0')}:00`;
          const available = availableSlots.some(
            (slot) => isSameDay(new Date(slot), selectedDate) && format(new Date(slot), 'HH:mm') === time
          );
          return (
            <button
              key={time}
              onClick={() => available && handleSlotSelect(time)}
              className={cn(
                'px-3 py-2 rounded border text-sm font-medium',
                selectedSlot?.includes(time)
                  ? 'bg-blue-600 text-white'
                  : available
                  ? 'bg-white text-gray-800 hover:bg-gray-100'
                  : 'text-gray-400 border-dashed cursor-not-allowed'
              )}
            >
              {time}
            </button>
          );
        })}
      </div>

      {/* Summary */}
      {selectedSlot && (
        <div className="p-4 bg-gray-50 border rounded-xl flex items-center gap-4">
          <img src={photoUrl} className="w-14 h-14 object-cover rounded-xl border" alt="doctor" />
          <div>
            <div className="font-semibold">{selectedDoctor?.name}</div>
            <div className="text-sm text-gray-600">{formattedDate} at {formattedTime}</div>
          </div>
        </div>
      )}

      {/* Patient Info */}
      {selectedSlot && !otpSent && (
        <div className="space-y-4">
          <Input placeholder="Parent's Name" value={patient.parentName} onChange={(e) => setPatient({ ...patient, parentName: e.target.value })} />
          <Input placeholder="Child's Name" value={patient.childName} onChange={(e) => setPatient({ ...patient, childName: e.target.value })} />
          <Input placeholder="Email" value={patient.email} onChange={(e) => setPatient({ ...patient, email: e.target.value })} />
          <Input placeholder="Phone Number" value={patient.phone} onChange={(e) => setPatient({ ...patient, phone: e.target.value })} />
          <Button onClick={handleSendOtp} className="w-full">Send OTP</Button>
        </div>
      )}

      {/* OTP */}
      {otpSent && (
        <div className="space-y-4">
          <InputOTP maxLength={6} value={otp} onChange={setOtp} className="justify-center">
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <Button onClick={handleVerifyOtp} className="w-full" disabled={loading}>
            {loading ? 'Verifying…' : 'Verify & Pay'}
          </Button>
        </div>
      )}
    </div>
  );
}