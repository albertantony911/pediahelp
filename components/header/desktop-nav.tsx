'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { CaretDown } from 'phosphor-react';
import { DoctorSearchDrawer } from '@/components/blocks/doctor/DoctorSearchDrawer';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { useDoctors } from '@/components/providers/DoctorsProvider';

// ----------------- Delayed Action Function -----------------

const delayedAction = (callback: () => void, delay = 150, skipDelay = false) => {
  if ('vibrate' in navigator) navigator.vibrate([10]);
  skipDelay ? callback() : setTimeout(callback, delay);
};

// ----------------- Dropdown Component -----------------

interface DropdownItem {
  name: string;
  href: string;
}

interface NavDropdownProps {
  label: string;
  items: DropdownItem[];
  isActive: boolean;
  open: boolean;
  setOpen: (value: boolean) => void;
}

function NavDropdown({
  label,
  items,
  isActive,
  open,
  setOpen,
}: NavDropdownProps) {
  const pathname = usePathname();

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="relative"
    >
      <Popover open={open}>
        <PopoverTrigger asChild>
          <button
            onClick={() => setOpen(!open)}
            className={cn(
              'text-sm font-semibold uppercase tracking-wide flex items-center gap-1 py-7 h-full',
              'cursor-pointer transition-all duration-200 ease-out transform',
              'hover:scale-105 active:scale-95 hover:brightness-95 hover:underline underline-offset-4',
              'focus:outline-none',
              isActive
                ? 'text-[var(--primary)]'
                : 'text-[var(--primary)]/80 hover:text-[var(--primary)]'
            )}
          >
            {label}
            <CaretDown
              weight="bold"
              className={cn(
                'size-3 transition-transform duration-200',
                open && 'rotate-180'
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          sideOffset={0}
          align="start"
          className={cn(
            'mt-1 w-max rounded-2xl border bg-white shadow-xl animate-fade-in',
            'transition-opacity duration-200 ease-in-out z-50 p-0 overflow-hidden'
          )}
        >
          {items.map(({ name, href }) => (
            <Link
              key={name}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'block py-4 px-6 text-sm font-semibold uppercase tracking-wide',
                'transition-all duration-200 ease-out',
                'hover:underline underline-offset-4 hover:bg-zinc-100 focus:bg-zinc-100',
                pathname === href
                  ? 'text-[var(--primary)]'
                  : 'text-[var(--primary)]/80 hover:text-[var(--primary)]'
              )}
            >
              {name}
            </Link>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ----------------- Nav Data -----------------

const specialtiesList = [
  { name: 'Nephrology', href: '/specialities/nephrology' },
  { name: 'Gastroenterology', href: '/specialities/gastroenterology' },
  { name: 'Neonatology', href: '/specialities/neonatology' },
  { name: 'Neurology', href: '/specialities/neurology' },
  { name: 'Lactation Support', href: '/specialities/lactation-support' },
  { name: 'Respiratory & Sleep Medicine', href: '/specialities/respiratory-and-sleep-medicine' },
  { name: 'Endocrinology', href: '/specialities/endocrinology' },
];


const navItems = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Consultation', href: '/consultation' },
  { label: 'Specialities', href: '/specialities', dropdown: true },
  { label: 'Resources', href: '/blog'},
  { label: 'Contact', href: '/contact' },
];

const dropdownItemsMap: Record<string, DropdownItem[]> = {
  specialities: specialtiesList,
};

// ----------------- Desktop Nav -----------------

export default function DesktopNav() {
  const pathname = usePathname();
  const navRef = useRef(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { scrollY } = useScroll();
  const allDoctors = useDoctors();

  const scale = useTransform(scrollY, [0, 100], [1, 0.97]);
  const y = useTransform(scrollY, [0, 100], [0, -6]);
  const background = useTransform(scrollY, [0, 100], [
    'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.9))',
    'linear-gradient(90deg, rgba(255,255,255,0.75), rgba(245,245,245,0.7))',
  ]);
  const boxShadow = useTransform(scrollY, [0, 100], [
    '0 2px 6px rgba(0,0,0,0.04)',
    '0 8px 24px rgba(0,0,0,0.12)',
  ]);
  const backdropFilter = useTransform(scrollY, [0, 100], ['blur(6px)', 'blur(12px)']);

  useEffect(() => {
    setActiveDropdown(null);
  }, [pathname]);

  const generateWhatsAppLink = (phone: string, message: string) => {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  };

  const whatsappLink = generateWhatsAppLink('+919970450260', 'Hi, I need help!');

  const renderNavItem = ({ label, href, dropdown }: typeof navItems[number]) => {
    const isActive = pathname === href;
    if (dropdown) {
      const items = dropdownItemsMap[label.toLowerCase()] || [];
      return (
        <NavDropdown
          key={label}
          label={label}
          items={items}
          isActive={isActive}
          open={activeDropdown === label}
          setOpen={(open) => setActiveDropdown(open ? label : null)}
        />
      );
    }

    return (
      <Link
        key={label}
        href={href}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'text-sm font-semibold uppercase tracking-wide',
          'cursor-pointer transition-all duration-200 ease-out transform',
          'hover:scale-105 active:scale-95 hover:brightness-110 hover:underline underline-offset-4',
          isActive
            ? 'text-[var(--primary)]'
            : 'text-[var(--primary)]/80 hover:text-[var(--primary)]'
        )}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav
      ref={navRef}
      aria-label="Primary navigation"
      className="fixed top-0 inset-x-0 z-50 pt-[calc(env(safe-area-inset-top))] px-4"
    >
      <motion.div
        ref={navContainerRef}
        style={{ scale, y, background, boxShadow, backdropFilter }}
        transition={{ type: 'spring', stiffness: 180, damping: 20, mass: 0.8 }}
        className="max-w-7xl mx-auto px-6 mt-2 sm:mt-4 md:mt-6 flex justify-between items-center rounded-full border border-white/30 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      >
        <Link
          href="/"
          className="h-16  px-6 flex items-center justify-center "
        >
          <Image
            src="/images/logo_dark.svg"
            alt="Logo"
            width={240}
            height={80}
            className="h-16 w-auto"
          />
        </Link>

        <div className="flex gap-6 items-center">
          {navItems.map(renderNavItem)}
        </div>

        <div className="flex gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="default">
                Help
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="max-w-sm rounded-4xl p-4 shadow-lg text-center bg-white/90 backdrop-blur-lg">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-lg font-semibold text-gray-900 text-center">
                  Redirect to WhatsApp
                </AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-gray-600 text-center">
                  Would you like to be redirected to WhatsApp for help?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4 mx-auto flex justify-center gap-2 text-center">
                <AlertDialogCancel className="border-gray-300 text-gray-700 hover:bg-gray-100">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    variant="whatsapp"
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Continue
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <DoctorSearchDrawer allDoctors={allDoctors}>
            <Button
              variant="default"
              size="default"
              onClick={() => delayedAction(() => null)}
              aria-label="Book an Appointment"
            >
              Book an Appointment
            </Button>
          </DoctorSearchDrawer>
        </div>
      </motion.div>
    </nav>
  );
}