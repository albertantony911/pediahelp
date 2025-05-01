'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { DoctorSearchDrawer } from '@/components/blocks/doctor/DoctorSearchDrawer';

export default function DesktopNav() {
  const pathname = usePathname();
  const navRef = useRef(null);
  const { scrollY } = useScroll();

  // Scroll-linked animations
  const scale = useTransform(scrollY, [0, 100], [1, 0.97]);
  const y = useTransform(scrollY, [0, 100], [0, -6]);
  const blur = useTransform(scrollY, [0, 100], ['blur(6px)', 'blur(12px)']);
  const shadow = useTransform(
    scrollY,
    [0, 100],
    ['0 2px 6px rgba(0,0,0,0.04)', '0 8px 24px rgba(0,0,0,0.12)']
  );
  const bg = useTransform(
    scrollY,
    [0, 100],
    [
      'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.9))',
      'linear-gradient(90deg, rgba(255,255,255,0.75), rgba(245,245,245,0.7))'
    ]
  );

  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Specialities', href: '/specialities' },
    { label: 'Resources', href: '/resources' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <nav
      aria-label="Primary navigation"
      ref={navRef}
      className={cn(
        'fixed top-0 inset-x-0 z-50',
        'pt-[calc(env(safe-area-inset-top))] px-4'
      )}
    >
      <motion.div
        style={{
          scale,
          y,
          background: bg,
          boxShadow: shadow,
          backdropFilter: blur,
        }}
        transition={{
          type: 'spring',
          stiffness: 180,
          damping: 20,
          mass: 0.8,
        }}
        className={cn(
          'max-w-7xl mx-auto px-6 py-3',
          'mt-2 sm:mt-4 md:mt-6',
          'flex justify-between items-center',
          'rounded-full border border-white/30',
          'transition hover:brightness-110',
          'hover:-translate-y-0.5 hover:scale-[1.01] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]'
        )}
      >
        {/* Logo */}
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
                  isActive
                    ? 'text-[#5B1F1F]'
                    : 'text-[#5B1F1F]/80 hover:text-[#5B1F1F]'
                )}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* CTA Buttons */}
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