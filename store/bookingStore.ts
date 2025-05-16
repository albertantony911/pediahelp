'use client';

import { create } from 'zustand';

type BookingStep = 0 | 1 | 2 | 3 | 4;

interface PatientInfo {
  parentName: string;
  childName: string;
  phone: string;
  email: string;
}

interface BookingStore {
  step: BookingStep;
  selectedSlot: string | null;
  patient: PatientInfo;
  otpVerified: boolean;
  razorpayOrderId: string | null;

  setStep: (step: BookingStep) => void;
  setSlot: (slot: string) => void;
  setPatient: (data: Partial<PatientInfo>) => void;
  setOtpVerified: (verified: boolean) => void;
  setOrderId: (id: string) => void;
  reset: () => void;
}

export const useBookingStore = create<BookingStore>((set) => ({
  step: 0,
  selectedSlot: null,
  patient: {
    parentName: '',
    childName: '',
    phone: '',
    email: '',
  },
  otpVerified: false,
  razorpayOrderId: null,

  setStep: (step) => set({ step }),
  setSlot: (slot) => set({ selectedSlot: slot }),
  setPatient: (data) =>
    set((state) => ({
      patient: { ...state.patient, ...data },
    })),
  setOtpVerified: (verified) => set({ otpVerified: verified }),
  setOrderId: (id) => set({ razorpayOrderId: id }),
  reset: () =>
    set({
      step: 0,
      selectedSlot: null,
      patient: {
        parentName: '',
        childName: '',
        phone: '',
        email: '',
      },
      otpVerified: false,
      razorpayOrderId: null,
    }),
}));