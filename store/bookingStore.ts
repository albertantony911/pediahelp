'use client';

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type BookingStep = 0 | 1 | 2;

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
  appointmentId: string;
  slotLocked: boolean;
  otpVerified: boolean;
  handleSendOtp: () => void;

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
  setAppointmentId: (id: string) => void;
  lockSlot: () => void;
  unlockSlot: () => void;
  setOtpVerified: (value: boolean) => void;
  setHandleSendOtp: (fn: () => void) => void;
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
  appointmentId: uuidv4(),
  slotLocked: false,
  otpVerified: false,
  handleSendOtp: () => {},
  setStep: (step) => set({ step }),
  setSelectedDoctor: (doctor) => set({ selectedDoctor: doctor }),
  setSelectedSlot: (slot) => set({ selectedSlot: slot }),
  setAvailability: (data) => set({ availability: data }),
  setPatient: (info: PatientInfo) => set({ patient: info }),
  setOtp: (otp) => set({ otp }),
  setOtpStatus: (status) => set({ otpStatus: status }),
  setRazorpayOrderId: (id) => set({ razorpayOrderId: id }),
  setConfirmedBookingId: (id) => set({ confirmedBookingId: id }),
  setAppointmentId: (id) => set({ appointmentId: id }),
  lockSlot: () => set({ slotLocked: true }),
  unlockSlot: () => set({ slotLocked: false }),
  setOtpVerified: (value) => set({ otpVerified: value }),
  setHandleSendOtp: (fn) => set({ handleSendOtp: fn }),
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
      appointmentId: uuidv4(),
      slotLocked: false,
      otpVerified: false,
      handleSendOtp: () => {},
    }),
}));