'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getDoctorBySlug } from '@/sanity/queries/doctor';
import { useBookingStore } from '@/store/bookingStore';
import BookingLayout from '@/components/booking-flow/BookingLayout';

export default function BookingPage() {
  const { slug } = useParams();
  const setSelectedDoctor = useBookingStore((s) => s.setSelectedDoctor);
  const setAvailability = useBookingStore((s) => s.setAvailability);

  useEffect(() => {
    async function loadDoctor() {
      if (!slug) return;
      const doctor = await getDoctorBySlug(slug as string);
      if (doctor) {
        setSelectedDoctor(doctor);
        setAvailability(doctor.availability || null);
      }
    }

    loadDoctor();
  }, [slug, setSelectedDoctor, setAvailability]);

  return (
    <main className="min-h-screen py-10">
      <BookingLayout />
    </main>
  );
}