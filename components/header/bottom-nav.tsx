// File: components/header/bottom-nav.tsx

'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { debounce } from 'lodash';
import {
  House,
  Book,
  CalendarPlus,
  ChatTeardropText,
  List,
  CaretDown,
} from 'phosphor-react';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
} from '@/components/ui/drawer';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
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
import { Button } from '@/components/ui/button';
import { useDoctors } from '@/components/providers/DoctorsProvider';
import { motion, useAnimation } from 'framer-motion';

const delayedAction = (callback: () => void, delay = 150, skipDelay = false) => {
  if ('vibrate' in navigator) navigator.vibrate([10]);
  skipDelay ? callback() : setTimeout(callback, delay);
};

const generateWhatsAppLink = (phone: string, message: string) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

const navItems = [
  { label: 'Home', href: '/', icon: House },
  { label: 'Resources', href: '/blog', icon: Book },
  { label: 'Consult', href: '/consultation', icon: CalendarPlus, primary: true },
  { label: 'Help', href: '/help', icon: ChatTeardropText },
  { label: 'More', href: '#', icon: List, overflow: true },
];

const overflowItems = [
  { label: 'Home', href: '/', type: 'item' },
  { label: 'About', href: '/about', type: 'item' },
  { label: 'Consultation', href: '/consultation', type: 'item' },
  { label: 'Contact', href: '/contact', type: 'item' },
  { label: 'Resources', href: '/resources', type: 'item' },
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
];

const isActive = (current: string, href: string) => current === href;

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);
  const allDoctors = useDoctors();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollControls = useAnimation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const debouncedSetOpenCollapsible = debounce((label: string | null) => {
    setOpenCollapsible(label);
  }, 100);

  useEffect(() => {
    if (openCollapsible !== null && scrollContainerRef.current) {
      const el = scrollContainerRef.current;
      const needsScroll = el.scrollHeight > el.clientHeight + 24;
      if (needsScroll) {
        scrollControls.start({ y: 0, transition: { ease: 'easeOut', duration: 0.5 } });
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [openCollapsible, scrollControls]);

  const whatsappLink = generateWhatsAppLink('+919970450260', 'Hi, I need help!');

  return (
    <nav
      className={cn(
        'fixed bottom-0 inset-x-0 z-50 xl:hidden',
        'backdrop-blur-md bg-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.1)]',
        'flex items-center justify-between h-20 px-4',
        'pb-[calc(env(safe-area-inset-bottom))]'
      )}
    >
      {navItems.map(({ label, href, icon: Icon, primary, overflow }) => {
        const active = isActive(pathname, href);

        if (overflow) {
          return (
            <Drawer key={label} open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <button
                  aria-label={`${label} menu`}
                  onClick={() => delayedAction(() => setDrawerOpen(true), 0, true)}
                  className={cn(
                    'group relative w-16 h-full flex flex-col items-center justify-center z-10',
                    active ? 'text-[var(--mid-shade)]' : 'text-[var(--dark-shade)] opacity-75'
                  )}
                >
                  <Icon weight="fill" className="w-7 h-7 group-hover:scale-110 group-active:scale-95 transition-transform" />
                  <span className="text-[11px] mt-1">{label}</span>
                </button>
              </DrawerTrigger>

              <DrawerContent className="max-h-[80vh] bg-white rounded-t-[24px] px-4 pb-6 shadow-[inset_0_-12px_8px_-6px_rgba(0,0,0,0.05)]">
                <motion.div
                  ref={scrollContainerRef}
                  animate={scrollControls}
                  className="overflow-y-auto max-h-[calc(80vh-4rem)] space-y-2"
                >
                  <ul className="space-y-2">
                    {overflowItems.map((section: any) => {
                      if (section.type === 'group') {
                        return (
                          <Collapsible
                            key={section.label}
                            open={openCollapsible === section.label}
                            onOpenChange={() =>
                              debouncedSetOpenCollapsible(
                                openCollapsible === section.label ? null : section.label
                              )
                            }
                          >
                            <CollapsibleTrigger asChild>
                              <button
                                className="w-full flex justify-between items-center px-4 py-3 text-base font-medium text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <span>{section.label}</span>
                                <CaretDown
                                  weight="bold"
                                  className={cn(
                                    'size-4 transition-transform duration-200',
                                    openCollapsible === section.label && 'rotate-180'
                                  )}
                                />
                              </button>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="mt-1 pl-4 space-y-1">
                              {section.items?.map((item: any) => (
                                <button
                                  key={item.label}
                                  onClick={() => {
                                    if (item.href) {
                                      delayedAction(() => {
                                        setDrawerOpen(false);
                                        router.push(item.href);
                                      });
                                    }
                                  }}
                                  className={cn(
                                    'block w-full text-left px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors',
                                    isActive(pathname, item.href ?? '') &&
                                      'text-[var(--mid-shade)] font-semibold bg-gray-100'
                                  )}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      }

                      return (
                        <li key={section.label}>
                          <button
                            onClick={() => {
                              if (section.href) {
                                delayedAction(() => {
                                  setDrawerOpen(false);
                                  router.push(section.href);
                                });
                              }
                            }}
                            className={cn(
                              'block w-full text-left px-4 py-3 text-base font-medium text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors',
                              isActive(pathname, section.href ?? '') &&
                                'text-[var(--mid-shade)] font-semibold bg-gray-100'
                            )}
                          >
                            {section.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </motion.div>
              </DrawerContent>
            </Drawer>
          );
        }

        if (primary) {
          return (
            <DoctorSearchDrawer key={label} allDoctors={allDoctors}>
              <button
                aria-label={label}
                onClick={() => delayedAction(() => null)}
                className="group relative flex flex-col items-center justify-center"
              >
                <span className="w-16 h-16 rounded-full bg-[var(--mid-shade)] text-white flex items-center justify-center hover:scale-100 active:scale-95 transition-all shadow-md animate-floatPulse">
                  <Icon weight="fill" className="w-[28px] h-[28px]" />
                </span>
              </button>
            </DoctorSearchDrawer>
          );
        }

        if (label.toLowerCase() === 'help') {
          return (
            <AlertDialog key={label}>
              <AlertDialogTrigger asChild>
                <button
                  aria-label={label}
                  onClick={() => delayedAction(() => null)}
                  className={cn(
                    'group relative w-16 h-full flex flex-col items-center justify-center z-10',
                    active ? 'text-[var(--mid-shade)]' : 'text-[var(--dark-shade)] opacity-75'
                  )}
                >
                  <Icon weight="fill" className="w-7 h-7 group-hover:scale-110 group-active:scale-95 transition-transform" />
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

        return (
          <button
            key={label}
            onClick={() => delayedAction(() => router.push(href))}
            aria-label={label}
            className={cn(
              'group relative w-16 h-full flex flex-col items-center justify-center z-10',
              active ? 'text-[var(--mid-shade)]' : 'text-[var(--dark-shade)] opacity-75'
            )}
          >
            <Icon weight="fill" className="w-7 h-7 transition-transform group-hover:scale-110 group-active:scale-95" />
            <span className="text-[11px] mt-1">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}