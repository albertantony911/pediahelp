// store/bookingStore.ts
'use client';

import { create } from 'zustand';

export type BookingStep = 0 | 1 | 2 | 3; // Step 3 = Payment, Step 4 = Success (optional)

export interface PatientInfo {
  parentName: string;
  childName: string;
  phone: string;
  email: string;
}

export type WeeklyAvailability = {
  monday?: string[];
  tuesday?: string[];
  wednesday?: string[];
  thursday?: string[];
  friday?: string[];
  saturday?: string[];
  sunday?: string[];
};

export interface BookingStore {
  step: BookingStep;
  selectedDoctor: any | null;
  selectedSlot: string | null;
  availability: WeeklyAvailability | null;
  patient: PatientInfo;
  otp: string;
  otpStatus: 'pending' | 'verified' | 'failed';
  razorpayOrderId: string | null;
  confirmedBookingId: string | null;
  slotLocked: boolean;

  // Setters
  setStep: (step: BookingStep) => void;
  setSelectedDoctor: (doctor: any) => void;
  setSelectedSlot: (slot: string | null) => void;
  setAvailability: (data: WeeklyAvailability | null) => void;
  setPatient: (info: PatientInfo) => void;
  setOtp: (otp: string) => void;
  setOtpStatus: (status: BookingStore['otpStatus']) => void;
  setRazorpayOrderId: (id: string | null) => void;
  setConfirmedBookingId: (id: string | null) => void;
  lockSlot: () => void;
  unlockSlot: () => void;
  reset: () => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  step: 0,
  selectedDoctor: null,
  selectedSlot: null,
  availability: null,
  patient: {
    parentName: '',
    childName: '',
    phone: '',
    email: '',
  },
  otp: '',
  otpStatus: 'pending',
  razorpayOrderId: null,
  confirmedBookingId: null,
  slotLocked: false,

  setStep: (step) => set({ step }),
  setSelectedDoctor: (doctor) => set({ selectedDoctor: doctor }),
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
  setAvailability: (data) => set({ availability: data }),
  setPatient: (info) => set({ patient: info }),
  setOtp: (otp) => set({ otp }),
  setOtpStatus: (status) => set({ otpStatus: status }),
  setRazorpayOrderId: (id) => set({ razorpayOrderId: id }),
  setConfirmedBookingId: (id) => set({ confirmedBookingId: id }),
  lockSlot: () => set({ slotLocked: true }),
  unlockSlot: () => set({ slotLocked: false }),

  reset: () =>
    set({
      step: 0,
      selectedDoctor: null,
      selectedSlot: null,
      availability: null,
      patient: {
        parentName: '',
        childName: '',
        phone: '',
        email: '',
      },
      otp: '',
      otpStatus: 'pending',
      razorpayOrderId: null,
      confirmedBookingId: null,
      slotLocked: false,
    }),
}));