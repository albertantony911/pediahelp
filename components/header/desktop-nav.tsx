'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DoctorSearchDrawer } from '@/components/blocks/doctor/DoctorSearchDrawer'


type NavItem = {
  label: string;
  href: string;
  target?: boolean;
};

// Inline scroll hook
function useScrollY(threshold = 4) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > threshold);
    };

    handleScroll(); // initial check
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return scrolled;
}

export default function DesktopNav() {
  const pathname = usePathname();
  const scrolled = useScrollY();

  const navItems: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Specialities', href: '/specialities' },
    { label: 'Resources', href: '/resources' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        'fixed top-0 inset-x-0 z-50',
        'bg-transparent backdrop-blur-md',
        'pt-[calc(env(safe-area-inset-top))] px-4'
      )}
    >
      <motion.div
        initial={{ scale: 1 }}
        animate={{
          scale: scrolled ? 0.97 : 1,
          boxShadow: scrolled
            ? '0 4px 12px rgba(0,0,0,0.08)'
            : '0 2px 4px rgba(0,0,0,0.03)',
        }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className={cn(
          'max-w-7xl mx-auto px-6 py-3',
          'mt-2 sm:mt-4 md:mt-6', // ✅ Responsive spacing from top
          'flex justify-between items-center',
          'rounded-full border border-white/40',
          'bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:backdrop-blur-lg',
          'shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]',
          'transition hover:brightness-125'
        )}
      >
        {/* Left Logo */}
        <Link
          href="/"
          className="h-12 min-w-[90px] px-6 flex items-center justify-center rounded-full bg-zinc-700 text-[#5B1F1F] font-semibold text-sm tracking-widest"
        >
          LOGO
        </Link>

        {/* Nav Links */}
<div className="flex gap-6">
  {navItems.map(({ label, href }) => {
    const isActive = pathname === href;
    return (
      <Link
        key={label}
        href={href}
        className={cn(
          'text-sm font-semibold uppercase tracking-wide',
          'cursor-pointer transition-all duration-200 ease-out transform',
          'hover:scale-105 active:scale-95 hover:brightness-110 hover:underline underline-offset-4',
          isActive ? 'text-[#5B1F1F]' : 'text-[#5B1F1F]/80 hover:text-[#5B1F1F]'
        )}
      >
        {label}
      </Link>
    );
  })}
</div>

    {/* Right CTA Buttons */}
    <div className="flex gap-3">
      <Button href="/ask-doctor" variant="outline" size="default">
        Ask Doctor
      </Button>

      <DoctorSearchDrawer>
        <Button variant="default" size="default">
          Book Consultation
        </Button>
      </DoctorSearchDrawer>
    </div>
      </motion.div>
    </nav>
  );
}