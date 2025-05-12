'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  House,
  Book,
  CalendarPlus,
  ChatTeardropText,
  List,
  X,
  CaretDown,
} from 'phosphor-react';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
} from '@/components/ui/drawer';
import { DoctorSearchDrawer } from '@/components/blocks/doctor/DoctorSearchDrawer';
// --- New Imports for AlertDialog and Button ---
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
import { Button } from '@/components/ui/button';

// Utility: haptic + delay
const delayedAction = (callback: () => void, delay = 150) => {
  navigator.vibrate?.([10]);
  setTimeout(callback, delay);
};

// --- WhatsApp Link Generator (Copied from desktop-nav.tsx) ---
const generateWhatsAppLink = (phone: string, message: string) => {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phone}?text=${encodedMessage}`;
};

const navItems = [
  { label: 'Home', href: '/', icon: House },
  { label: 'Resources', href: '/blog', icon: Book },
  { label: 'Consult', href: '/consultation', icon: CalendarPlus, primary: true },
  { label: 'Help', href: '/help', icon: ChatTeardropText }, // No changes here
  { label: 'More', href: '#', icon: List, overflow: true },
];

// Scalable drawer menu items (unchanged)
const overflowItems = [
  {
    label: 'Home',
    href: '/',
    type: 'item',
  },
  {
    label: 'Consultation',
    href: '/consultation',
    type: 'item',
  },
  {
    label: 'Contact',
    href: '/contact',
    type: 'item',
  },
  {
    label: 'About',
    type: 'group',
    items: [
      { label: 'Our Story', href: '/about' },
      { label: 'Our Team', href: '/about#team' },
    ],
  },
  {
    label: 'Specialities',
    type: 'group',
    items: [
      { label: 'Nephrology', href: '/specialities/nephrology' },
      { label: 'Gastroenterology', href: '/specialities/gastroenterology' },
      { label: 'Neonatology', href: '/specialities/neonatology' },
      { label: 'Neurology', href: '/specialities/neurology' },
      { label: 'Lactation Support', href: '/specialities/lactation-support' },
      { label: 'Respiratory & Sleep', href: '/specialities/respiratory-and-sleep-medicine' },
      { label: 'Endocrinology', href: '/specialities/endocrinology' },
    ],
  },
  {
    label: 'Resources',
    type: 'group',
    items: [
      { label: 'Blogs', href: '/resources/blogs' },
      { label: 'Childcare', href: '/resources/childcare' },
      { label: 'Lactation', href: '/resources/lactation' },
      { label: 'FAQs', href: '/faq' },
    ],
  },
];

const isActive = (current: string, href: string) => current === href;

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const moreIsActive = overflowItems.some((item: any) =>
    item.type === 'item'
      ? isActive(pathname, item.href)
      : item.items?.some((sub: any) => isActive(pathname, sub.href))
  );

  // --- WhatsApp Link for Help Button ---
  const whatsappLink = generateWhatsAppLink('+919970450260', 'Hi, I need help!');

  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        'fixed bottom-0 inset-x-0 z-50 xl:hidden',
        'backdrop-blur-md bg-white/80',
        'shadow-[0_4px_20px_rgba(0,0,0,0.1)]',
        'flex items-center justify-between h-20 px-4',
        'pb-[calc(env(safe-area-inset-bottom))]'
      )}
    >
      {/* Curved background behind CTA */}
      <div className="absolute left-1/2 top-0 z-0 -translate-x-1/2" />

      {navItems.map(({ label, href, icon: Icon, primary, overflow }) => {
        const active = isActive(pathname, href);

        // Overflow drawer (unchanged)
        if (overflow) {
          return (
            <Drawer key={label} open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <button
                  aria-label={`${label} menu`}
                  onClick={() => delayedAction(() => setDrawerOpen(true))}
                  className={cn(
                    'group relative w-16 h-full flex flex-col items-center justify-center z-10',
                    moreIsActive
                      ? 'text-[var(--mid-shade)]'
                      : 'text-[var(--dark-shade)] opacity-75'
                  )}
                >
                  <Icon
                    weight="fill"
                    className="w-7 h-7 transition-transform group-hover:scale-110 group-active:scale-95"
                  />
                  <span className="text-[11px] mt-1">{label}</span>
                </button>
              </DrawerTrigger>

              <DrawerContent className="max-h-[75vh] bg-white rounded-t-[20px] pt-2 pb-16 px-0 shadow-xl">
                {/* Pull indicator & text */}
                <div className="text-[10px] text-muted-foreground mt-1 text-center">
                  Pull down to close
                </div>

                {/* Scrollable content */}
                <div className="overflow-y-auto max-h-[calc(75vh-3rem)] px-6 pt-4">
                  <ul className="space-y-4">
                    {(() => {
                      const [openIndex, setOpenIndex] = useState<number | null>(null);

                      return overflowItems.map((section: any, idx: number) => {
                        const isOpen = openIndex === idx;

                        if (section.type === 'group') {
                          return (
                            <li key={section.label}>
                              <button
                                className="w-full flex justify-start items-center gap-2 px-4 py-3 text-base font-semibold rounded-xl bg-muted/30 text-[var(--dark-shade)] transition-all hover:bg-muted active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mid-shade)]"
                                onClick={() => setOpenIndex(isOpen ? null : idx)}
                              >
                                <CaretDown
                                  weight="bold"
                                  className={`size-4 text-muted-foreground transition-transform ${
                                    isOpen ? 'rotate-180' : ''
                                  }`}
                                />
                                <span>{section.label}</span>
                              </button>

                              <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                                  isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                                }`}
                              >
                                <ul className="flex flex-col px-7 pb-2 pt-1 space-y-2">
                                  {section.items.map((item: any) => (
                                    <li key={item.label}>
                                      <button
                                        onClick={() =>
                                          delayedAction(() => router.push(item.href))
                                        }
                                        className={cn(
                                          'block w-full text-left px-3 py-3 rounded-md font-medium text-sm transition-all',
                                          'bg-white hover:bg-muted active:scale-[.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mid-shade)]',
                                          isActive(pathname, item.href) &&
                                            'text-[var(--mid-shade)] font-semibold bg-muted'
                                        )}
                                      >
                                        {item.label}
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </li>
                          );
                        }

                        return (
                          <li key={section.label}>
                            <button
                              onClick={() => delayedAction(() => router.push(section.href))}
                              className={cn(
                                'block w-full text-left px-4 py-4 text-base font-semibold rounded-xl bg-muted/30 text-[var(--dark-shade)]',
                                'hover:bg-muted active:scale-[.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mid-shade)]',
                                isActive(pathname, section.href) &&
                                  'text-[var(--mid-shade)] bg-muted font-semibold'
                              )}
                            >
                              {section.label}
                            </button>
                          </li>
                        );
                      });
                    })()}
                  </ul>
                </div>
              </DrawerContent>
            </Drawer>
          );
        }

        // Primary CTA (unchanged)
        if (primary) {
          return (
            <DoctorSearchDrawer key={label}>
              <button
                aria-label={label}
                onClick={() => delayedAction(() => null)}
                className="group relative flex flex-col items-center justify-center"
              >
                <span
                  className={cn(
                    'w-16 h-16 rounded-full flex items-center justify-center',
                    'bg-[var(--mid-shade)] text-white animate-floatPulse',
                    'hover:scale-100 active:scale-95 active:shadow-inner',
                    'transition-all duration-200 ease-out',
                    'shadow-[0_6px_10px_rgba(0,0,0,0.5)]',
                    'focus-visible:ring-2 ring-offset-2 ring-[var(--mid-shade)]'
                  )}
                >
                  <Icon
                    weight="fill"
                    className="w-[28px] h-[28px] drop-shadow-sm transition-transform group-hover:scale-105"
                  />
                </span>
              </button>
            </DoctorSearchDrawer>
          );
        }

        // --- Modified Help Button ---
        if (label.toLowerCase() === 'help') {
          return (
            <AlertDialog key={label}>
              <AlertDialogTrigger asChild>
                <button
                  aria-label={label}
                  onClick={() => delayedAction(() => null)}
                  className={cn(
                    'group relative w-16 h-full flex flex-col items-center justify-center z-10',
                    active
                      ? 'text-[var(--mid-shade)]'
                      : 'text-[var(--dark-shade)] opacity-75'
                  )}
                >
                  <Icon
                    weight="fill"
                    className="w-7 h-7 transition-transform group-hover:scale-110 group-active:scale-95"
                  />
                  <span className="text-[11px] mt-1">{label}</span>
                </button>
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
                <AlertDialogFooter className="mt-4 mx-auto flex-row flex justify-center gap-2 text-center">
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
          );
        }

        // Standard nav buttons (unchanged)
        return (
          <button
            key={label}
            onClick={() => delayedAction(() => router.push(href))}
            aria-label={label}
            className={cn(
              'group relative w-16 h-full flex flex-col items-center justify-center z-10',
              active
                ? 'text-[var(--mid-shade)]'
                : 'text-[var(--dark-shade)] opacity-75'
            )}
          >
            <Icon
              weight="fill"
              className="w-7 h-7 transition-transform group-hover:scale-110 group-active:scale-95"
            />
            <span className="text-[11px] mt-1">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}