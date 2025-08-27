'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getDoctorBySlug } from '@/sanity/queries/doctor';
import { useBookingStore } from '@/store/bookingStore';
import BookingLayout from '@/components/booking-flow/BookingLayout';
import Logo from '@/components/logo';


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
    
    <main className=" bg-dark-shade">
      {/* Mobile-only SVG Logo */}
            <div className="w-full flex justify-center items-center bg-dark-shade lg:hidden">
              <Logo />
            </div>
      <BookingLayout />
      <div className="w-screen h-[100px] relative">
        <img
          src="/waves/dark-to-white-desktop-1.svg"
          alt="Wave divider desktop"
          className="hidden lg:block w-full h-full object-cover absolute top-0 left-0"
        />
        <img
          src="/waves/dark-to-white-mobile-1.svg"
          alt="Wave divider mobile"
          className="lg:hidden w-full h-full object-cover absolute top-0 left-0"
        />
      </div>
    </main>
  );
}