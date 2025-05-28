'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { debounce } from 'lodash';
import { CaretDown as CaretDownIcon } from 'phosphor-react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
} from '@/components/ui/drawer';
import {
  Collapsible,
  CollapsibleTrigger,
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

interface NavItem {
  label: string;
  href: string;
  logoSrc?: string;
  primary?: boolean;
  overflow?: boolean;
  customVariants?: keyof typeof navAnimations.buttonVariants; // Constrained to specific variant keys
}

interface OverflowItem {
  label: string;
  href?: string;
  type: 'item' | 'group';
  items?: { label: string; href: string }[];
}

// Centralized styles for navigation items
const navItemStyles = {
  button: (active: boolean) =>
    cn(
      'group relative w-16 h-full flex flex-col items-center justify-center z-10',
      active ? 'text-[var(--mid-shade)]' : 'text-[var(--dark-shade)] opacity-75'
    ),
  label: 'font-secondary uppercase text-[var(--dark-shade)] text-[10px] mt-1',
  icon: 'w-9 h-9 object-contain',
  primaryButton:
    'relative w-16 h-16 rounded-full bg-[var(--mid-shade)] text-white flex items-center justify-center z-10 overflow-visible transition-all duration-200 group-hover:bg-[var(--mid-shade)]/90',
  primaryIcon: 'relative w-[36px] h-[36px] object-contain z-10',
};

// Animation variants for navigation
const navAnimations = {
  logoVariants: {
    initial: {
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    breathe: {
      scale: [1, 1.08, 1],
      transition: {
        duration: 3,
        ease: [0.4, 0, 0.2, 1],
        repeat: Infinity,
        repeatType: 'loop' as const,
      },
    },
    wiggle: {
      rotate: [0, 5, -5, 2, -2, 0],
      scale: 1,
      transition: {
        duration: 1.5,
        ease: [0.68, -0.55, 0.265, 1.55],
        times: [0, 0.2, 0.4, 0.6, 0.8, 1],
      },
    },
    tap: {
      scale: [1, 0.9, 1],
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  },
  buttonVariants: {
    initial: {
      scale: 1,
      rotate: 0,
      y: 0,
    },
    hover: {
      scale: 1.02,
      y: -1,
      transition: {
        duration: 0.25,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
    tap: {
      scale: [1, 0.9, 1],
      rotate: [0, 360],
      y: [0, 2, 0],
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
        scale: { times: [0, 0.3, 1] },
        rotate: { times: [0, 1] },
      },
    },
    tapNonPulse: {
      scale: [1, 0.9, 1],
      y: [0, 4, 0],
      transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94],
        scale: { times: [0, 0.5, 1] },
        y: { times: [0, 0.5, 1] },
      },
    },
    active: {
      scale: [1, 0.9, 1],
      rotate: [0, 360],
      y: [0, 2, 0],
      transition: {
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
        scale: { times: [0, 0.3, 1] },
        rotate: { times: [0, 1] },
      },
    },
  },
};

// Centralized navigation items
const navItems: NavItem[] = [
  { label: 'Home', href: '/', logoSrc: '/images/icons/ph_home_icon.svg' },
  { label: 'Resources', href: '/blog', logoSrc: '/images/icons/ph_resources_icon.svg' },
  { label: 'Consult', href: '/consultation', logoSrc: '/images/logo_icon.svg', primary: true },
  { label: 'Help', href: '/help', logoSrc: '/images/icons/ph_help_icon.svg' },
  { label: 'More', href: '#', logoSrc: '/images/icons/ph_hamburger_icon.svg', overflow: true },
];

const overflowItems: OverflowItem[] = [
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

const delayedAction = (callback: () => void, delay = 150, skipDelay = false) => {
  if ('vibrate' in navigator) navigator.vibrate([10]);
  skipDelay ? callback() : setTimeout(callback, delay);
};

const generateWhatsAppLink = (phone: string, message: string) =>
  `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

// Reusable Nav Item Button Component
function NavItemButton({
  label,
  href,
  logoSrc,
  active,
  onClick,
  prefersReducedMotion,
  variant,
}: {
  label: string;
  href: string;
  logoSrc?: string;
  active: boolean;
  onClick: () => void;
  prefersReducedMotion: boolean | null;
  variant: keyof typeof navAnimations.buttonVariants;
}) {
  return (
    <motion.button
      aria-label={label}
      onClick={onClick}
      className={navItemStyles.button(active)}
      variants={navAnimations.buttonVariants}
      initial="initial"
      whileHover={prefersReducedMotion ? undefined : "hover"}
      whileTap={prefersReducedMotion ? undefined : variant}
    >
      {logoSrc && (
        <motion.img
          src={logoSrc}
          alt={`${label} icon`}
          className={navItemStyles.icon}
          variants={navAnimations.logoVariants}
          initial="initial"
          animate={prefersReducedMotion ? undefined : variant}
          whileHover={prefersReducedMotion ? undefined : "hover"}
          whileTap={prefersReducedMotion ? undefined : "tap"}
          style={{
            transformOrigin: "center center",
            willChange: "transform",
          }}
          onError={() => console.error(`Failed to load SVG at ${logoSrc}`)}
          onContextMenu={(e) => e.preventDefault()}
        />
      )}
      <span className={navItemStyles.label}>{label}</span>
    </motion.button>
  );
}

// Reusable Drawer Content Component
function NavDrawerContent({
  pathname,
  router,
  scrollContainerRef,
  openCollapsible,
  setOpenCollapsible,
  setDrawerOpen,
}: {
  pathname: string;
  router: ReturnType<typeof useRouter>;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
  openCollapsible: string | null;
  setOpenCollapsible: (label: string | null) => void;
  setDrawerOpen: (open: boolean) => void;
}) {
  const debouncedSetOpenCollapsible = debounce((label: string | null) => {
    setOpenCollapsible(label);
  }, 100);

  return (
    <DrawerContent className="max-h-[80vh] bg-white rounded-t-[24px] px-4 pb-6 shadow-[inset_0_-12px_8px_-6px_rgba(0,0,0,0.05)]">
      <div ref={scrollContainerRef} className="overflow-y-auto max-h-[calc(80vh-4rem)] space-y-2 mt-1">
        <ul className="space-y-2">
          {overflowItems.map((section, index) => {
            const spacingClass = index === 0 ? 'mt-2' : '';

            if (section.type === 'group') {
              return (
                <li key={section.label} className={spacingClass}>
                  <Collapsible
                    open={openCollapsible === section.label}
                    onOpenChange={() =>
                      debouncedSetOpenCollapsible(
                        openCollapsible === section.label ? null : section.label
                      )
                    }
                  >
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex justify-between items-center px-4 py-3 text-base font-medium text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                        <span>{section.label}</span>
                        <CaretDownIcon
                          weight="bold"
                          className={cn(
                            'size-4 transition-transform duration-200',
                            openCollapsible === section.label && 'rotate-180'
                          )}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <AnimatePresence initial={false}>
                      {openCollapsible === section.label && (
                        <motion.div
                          key={section.label}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: 'easeInOut' }}
                          className="overflow-hidden mt-1 pl-4"
                          ref={(el) => {
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }}
                        >
                          <motion.div
                            variants={{
                              open: {
                                transition: { staggerChildren: 0.05, delayChildren: 0.05 },
                              },
                              closed: {},
                            }}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            className="space-y-1"
                          >
                            {section.items?.map((item) => (
                              <motion.button
                                key={item.label}
                                variants={{
                                  closed: { opacity: 0, y: 4 },
                                  open: { opacity: 1, y: 0 },
                                }}
                                onClick={() => {
                                  if (item.href) {
                                    delayedAction(() => {
                                      setDrawerOpen(false);
                                      router.push(item.href!);
                                    });
                                  }
                                }}
                                className={cn(
                                  'block w-full text-left px-3 py-2 text-sm font-medium text-gray-700',
                                  'hover:bg-gray-100 rounded-md transition-colors',
                                  isActive(pathname, item.href ?? '') &&
                                    'text-[var(--mid-shade)] font-semibold bg-gray-100'
                                )}
                              >
                                {item.label}
                              </motion.button>
                            ))}
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Collapsible>
                </li>
              );
            }

            return (
              <li key={section.label} className={spacingClass}>
                <button
                  onClick={() => {
                    if (section.href) {
                      delayedAction(() => {
                        setDrawerOpen(false);
                        router.push(section.href!);
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
      </div>
    </DrawerContent>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);
  const [variant, setVariant] = useState<"initial" | "breathe" | "wiggle">("initial");
  const allDoctors = useDoctors();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  // Seamless breathe-wiggle loop for primary button
  useEffect(() => {
    if (prefersReducedMotion) return;

    const initialTimer = setTimeout(() => {
      const cycleAnimation = () => {
        setVariant("breathe");
        breatheTimerRef.current = setTimeout(() => {
          setVariant("wiggle");
          wiggleTimerRef.current = setTimeout(() => cycleAnimation(), 1500);
        }, 6000);
      };
      cycleAnimation();
    }, 500);

    return () => {
      clearTimeout(initialTimer);
      if (breatheTimerRef.current) clearTimeout(breatheTimerRef.current);
      if (wiggleTimerRef.current) clearTimeout(wiggleTimerRef.current);
    };
  }, [prefersReducedMotion]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const whatsappLink = generateWhatsAppLink('+919970450260', 'Hi, I need help!');
  const breatheTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wiggleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <nav
      className={cn(
        'fixed bottom-0 inset-x-0 z-50 xl:hidden',
        'backdrop-blur-md bg-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.1)]',
        'flex items-center justify-between h-20 px-4',
        'pb-[calc(env(safe-area-inset-bottom))]'
      )}
    >
      {navItems.map(({ label, href, logoSrc, primary, overflow, customVariants }) => {
        const active = isActive(pathname, href);
        const tapVariant: keyof typeof navAnimations.buttonVariants = customVariants ?? (primary ? 'tap' : 'tapNonPulse');

        if (overflow) {
          return (
            <Drawer key={label} open={drawerOpen} onOpenChange={(open) => {
              setDrawerOpen(open);
              if (!open) setOpenCollapsible(null);
            }}>
              <DrawerTrigger asChild>
                <NavItemButton
                  label={label}
                  href={href}
                  logoSrc={logoSrc}
                  active={active}
                  onClick={() => delayedAction(() => setDrawerOpen(true), 0, true)}
                  prefersReducedMotion={prefersReducedMotion}
                  variant={tapVariant}
                />
              </DrawerTrigger>
              <NavDrawerContent
                pathname={pathname}
                router={router}
                scrollContainerRef={scrollContainerRef}
                openCollapsible={openCollapsible}
                setOpenCollapsible={setOpenCollapsible}
                setDrawerOpen={setDrawerOpen}
              />
            </Drawer>
          );
        }

        if (primary) {
          return (
            <DoctorSearchDrawer key={label} allDoctors={allDoctors}>
              <motion.div
                className="group relative flex flex-col items-center justify-center z-10 cursor-pointer"
                variants={navAnimations.buttonVariants}
                initial="initial"
                whileHover={prefersReducedMotion ? undefined : "hover"}
                whileTap={prefersReducedMotion ? undefined : tapVariant}
                style={{
                  filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.12)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.08))',
                }}
              >
                <span className={navItemStyles.primaryButton}>
                  {logoSrc ? (
                    <motion.img
                      src={logoSrc}
                      alt={`${label} logo`}
                      className={navItemStyles.primaryIcon}
                      initial="initial"
                      animate={prefersReducedMotion ? undefined : variant}
                      whileHover={prefersReducedMotion ? undefined : "hover"}
                      whileTap={prefersReducedMotion ? undefined : "tap"}
                      variants={navAnimations.logoVariants}
                      style={{
                        transformOrigin: "center center",
                        willChange: "transform",
                      }}
                      onError={() => console.error(`Failed to load SVG at ${logoSrc}`)}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  ) : (
                    <span className="text-white text-xl font-semibold z-10">C</span>
                  )}
                </span>
              </motion.div>
            </DoctorSearchDrawer>
          );
        }

        if (label.toLowerCase() === 'help') {
          return (
            <AlertDialog key={label}>
              <AlertDialogTrigger asChild>
                <NavItemButton
                  label={label}
                  href={href}
                  logoSrc={logoSrc}
                  active={active}
                  onClick={() => delayedAction(() => null)}
                  prefersReducedMotion={prefersReducedMotion}
                  variant={tapVariant}
                />
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
                <AlertDialogFooter className="mt-2 mx-auto flex flex-row gap-2">
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
          <NavItemButton
            key={label}
            label={label}
            href={href}
            logoSrc={logoSrc}
            active={active}
            onClick={() => delayedAction(() => router.push(href))}
            prefersReducedMotion={prefersReducedMotion}
            variant={tapVariant}
          />
        );
      })}
    </nav>
  );
}