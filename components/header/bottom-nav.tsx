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
} from 'phosphor-react';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
} from '@/components/ui/drawer';
import { DoctorSearchDrawer } from '@/components/blocks/doctor/DoctorSearchDrawer';

// Utility: haptic + delay
const delayedAction = (callback: () => void, delay = 150) => {
  navigator.vibrate?.([10]);
  setTimeout(callback, delay);
};

const navItems = [
  { label: 'Home', href: '/', icon: House },
  { label: 'Resources', href: '/blog', icon: Book },
  { label: 'Consult', href: '/booking', icon: CalendarPlus, primary: true },
  { label: 'Ask', href: '/ask-doctor', icon: ChatTeardropText },
  { label: 'More', href: '#', icon: List, overflow: true },
];

const overflowItems = [
  { label: 'Settings', href: '/settings' },
  { label: 'Profile', href: '/profile' },
];

const isActive = (current: string, href: string) => current === href;

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const moreIsActive = overflowItems.some((item) =>
    isActive(pathname, item.href)
  );

  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        'fixed bottom-0 inset-x-0 z-50 xl:hidden',
        'bg-white border-t shadow-sm',
        'flex items-center justify-between h-18 px-4',
        'pb-[calc(env(safe-area-inset-bottom))]'
      )}
    >
      {/* Curved background behind CTA */}
      <div className="absolute left-1/2 top-0 z-0 -translate-x-1/2 w-24 h-12 rounded-b-full bg-white/70 backdrop-blur-md " />

      {navItems.map(({ label, href, icon: Icon, primary, overflow }) => {
        const active = isActive(pathname, href);

        // Overflow menu
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

              <DrawerContent className="max-h-[75vh] bg-white rounded-t-[20px]">
                <div className="mx-auto mt-4 mb-6 h-1.5 w-12 rounded-full bg-muted" />
                <ul className="space-y-3 px-6 pb-10">
                  {overflowItems.map((item) => (
                    <li key={item.label}>
                      <button
                        onClick={() =>
                          delayedAction(() => router.push(item.href))
                        }
                        className={cn(
                          'block text-base font-medium w-full text-left transition-colors hover:text-[var(--mid-shade)]',
                          isActive(pathname, item.href) &&
                            'text-[var(--mid-shade)] font-semibold'
                        )}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
                <DrawerClose asChild>
                  <button
                    aria-label="Close menu"
                    className="absolute top-4 right-4 p-2 bg-muted/40 rounded-full hover:bg-muted"
                  >
                    <X weight="bold" className="h-5 w-5" />
                  </button>
                </DrawerClose>
              </DrawerContent>
            </Drawer>
          );
        }

        // Primary CTA button
        if (primary) {
          return (
            <DoctorSearchDrawer key={label}>
              <button
                aria-label={label}
                onClick={() => delayedAction(() => null)}
                className="group relative -mt-12 z-10 flex flex-col items-center justify-center animate-pop"
              >
                <span
                  className={cn(
                    'h-20 w-20 rounded-full flex items-center justify-center',
                    'bg-[var(--mid-shade)] text-white animate-floatPulse',
                    'hover:scale-110 active:scale-95 active:shadow-inner',
                    'transition-all duration-200 ease-out',
                    'shadow-[0_6px_16px_rgba(0,0,0,0.25)]',
                    'focus-visible:ring-2 ring-offset-2 ring-[var(--mid-shade)]'
                  )}
                >
                  <Icon
                    weight="fill"
                    className="w-10 h-10 drop-shadow-sm transition-transform group-hover:scale-105"
                  />
                </span>
                <span className="text-[11px] mt-1 text-[var(--dark-shade)]"></span>
              </button>
            </DoctorSearchDrawer>
          );
        }

        // Standard nav buttons
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