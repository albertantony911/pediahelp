// app/(main)/consultation/[slug]/booking/page.tsx
'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getDoctorBySlug } from '@/sanity/queries/doctor';
import { useBookingStore } from '@/store/bookingStore';
import BookingLayout from '@/components/booking-flow/BookingLayout';
import Logo from '@/components/logo';
import WaveDivider from '@/components/blocks/wave-divider';


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
        // ✅ Weekly availability now lives under doctor.appointment.weeklyAvailability
        setAvailability(doctor.appointment?.weeklyAvailability || null);
      }
    }
    loadDoctor();
  }, [slug, setSelectedDoctor, setAvailability]);

  return (
    <main className="bg-dark-shade">
      <div className="w-full flex justify-center items-center bg-dark-shade lg:hidden">
        <Logo />
      </div>
      <BookingLayout />
      {/* Wave Divider Section */}
      <WaveDivider
        desktopSrc="/waves/dark-to-white-desktop-1.svg"
        mobileSrc="/waves/dark-to-white-mobile-1.svg"
        height={100}
        bleed
      />
    </main>
  );
}