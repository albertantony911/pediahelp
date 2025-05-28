'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { debounce } from 'lodash';
import { CaretDown as CaretDownIcon } from 'phosphor-react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion, TargetAndTransition, VariantLabels } from 'framer-motion';
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
import algoliasearch from 'algoliasearch/lite'; // Added for pre-fetching

interface NavItem {
  label: string;
  href: string;
  logoSrc?: string;
  primary?: boolean;
  overflow?: boolean;
  customVariants?: keyof typeof navAnimations.buttonVariants;
}

interface OverflowItem {
  label: string;
  href?: string;
  type: 'item' | 'group';
  items?: { label: string; href: string }[];
}

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

const navAnimations: {
  logoVariants: { [key: string]: TargetAndTransition };
  buttonVariants: { [key: string]: TargetAndTransition };
  drawerItemVariants: { [key: string]: TargetAndTransition };
} = {
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
  drawerItemVariants: {
    initial: { scale: 1 },
    hover: { scale: 1.02, transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] } },
    tap: { scale: [1, 0.95, 1], transition: { duration: 0.15, ease: [0.25, 0.46, 0.45, 0.94], times: [0, 0.5, 1] } },
  },
};

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
      whileTap={prefersReducedMotion ? undefined : (typeof variant === 'string' ? variant : undefined)}
    >
      {logoSrc && (
        <motion.img
          src={logoSrc}
          alt={`${label} icon`}
          className={navItemStyles.icon}
          variants={navAnimations.logoVariants}
          initial="initial"
          animate={prefersReducedMotion ? undefined : (typeof variant === 'string' ? variant : undefined)}
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

function NavDrawerContent({
  pathname,
  router,
  scrollContainerRef,
  openCollapsible,
  setOpenCollapsible,
  setDrawerOpen,
}: {
  readonly pathname: string;
  readonly router: ReturnType<typeof useRouter>;
  readonly scrollContainerRef: React.RefObject<HTMLDivElement>;
  readonly openCollapsible: string | null;
  readonly setOpenCollapsible: (label: string | null) => void;
  readonly setDrawerOpen: (open: boolean) => void;
}) {
  const debouncedSetOpenCollapsible = debounce((label: string | null) => {
    setOpenCollapsible(label);
  }, 100);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <DrawerContent className="max-h-[calc(100vh-2rem)] bg-white rounded-t-[24px] px-6 pb-8 shadow-[inset_0_-12px_8px_-6px_rgba(0,0,0,0.05)] flex flex-col items-center">
      <div className="py-6 flex justify-center">
        <button
          onClick={() => {
            delayedAction(() => {
              setDrawerOpen(false);
              router.push('/');
            });
          }}
          className="focus:outline-none"
        >
          <Image
            src="/images/pediahelp_logo_transparent_vertical_black.svg"
            alt="PediaHelp Logo"
            width={200}
            height={200}
            className="object-contain"
          />
        </button>
      </div>
      <div
        ref={scrollContainerRef}
        className={cn(
          'min-h-0 flex-1 w-full flex flex-col items-center space-y-1',
          isAnimating ? 'overflow-y-hidden' : 'overflow-y-auto'
        )}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <motion.ul
          className="space-y-1 w-full"
          initial="closed"
          animate="open"
          variants={{
            open: { transition: { staggerChildren: 0.05, delayChildren: 0.2 } },
            closed: {},
          }}
          onAnimationComplete={() => setIsAnimating(false)}
        >
          {overflowItems.map((section: OverflowItem, index: number) => {
            if (section.type === 'group') {
              return (
                <motion.li
                  key={section.label}
                  className="w-full"
                  variants={{
                    closed: { opacity: 0, y: 4 },
                    open: { opacity: 1, y: 0, transition: { duration: 0.2 } },
                  }}
                >
                  <Collapsible
                    open={openCollapsible === section.label}
                    onOpenChange={() =>
                      debouncedSetOpenCollapsible(
                        openCollapsible === section.label ? null : section.label
                      )
                    }
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        className="w-full flex justify-center items-center py-1 text-base font-medium text-gray-700 font-secondary uppercase relative transition-colors duration-200"
                      >
                        <motion.span
                          variants={navAnimations.drawerItemVariants}
                          initial="initial"
                          whileHover="hover"
                          whileTap="tap"
                        >
                          {section.label}
                        </motion.span>
                        <motion.span
                          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 h-[1px] bg-mid-shade"
                          initial={{ width: '0%' }}
                          animate={{
                            width: openCollapsible === section.label ? '50%' : '0%',
                          }}
                          transition={{ duration: 0.5, ease: 'easeInOut' }}
                        />
                      </button>
                    </CollapsibleTrigger>
                    <AnimatePresence initial={false}>
                      {openCollapsible === section.label && (
                        <motion.div
                          key={section.label}
                          layout
                          initial={{ height: 0, opacity: 0 }}
                          animate={{
                            height: 'auto',
                            opacity: 1,
                            transition: { duration: 0.25, ease: 'easeInOut' },
                          }}
                          exit={{
                            height: 0,
                            opacity: 0,
                            transition: { duration: 0.2, ease: 'easeInOut' },
                          }}
                          style={{ minHeight: 0, overflow: 'hidden' }}
                          className={cn(
                            'mt-2 flex flex-col items-center',
                            section.label === 'Specialties' ? 'space-y-0.5' : 'space-y-1'
                          )}
                        >
                          {section.items?.map((item) => (
                            <button
                              key={item.label}
                              onClick={() => {
                                if (item.href) {
                                  delayedAction(() => {
                                    setDrawerOpen(false);
                                    router.push(item.href!);
                                  });
                                }
                              }}
                              className={cn(
                                'block w-full text-center py-1 font-medium text-gray-700 font-secondary uppercase transition-colors duration-200',
                                section.label === 'Specialties' ? 'text-sm' : 'text-sm',
                                isActive(pathname, item.href ?? '') &&
                                  'text-[var(--mid-shade)] font-medium'
                              )}
                            >
                              <motion.span
                                variants={navAnimations.drawerItemVariants}
                                initial="initial"
                                whileHover="hover"
                                whileTap="tap"
                              >
                                {item.label}
                              </motion.span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Collapsible>
                </motion.li>
              );
            }

            return (
              <motion.li
                key={section.label}
                className="w-full"
                variants={{
                  closed: { opacity: 0, y: 4 },
                  open: { opacity: 1, y: 0, transition: { duration: 0.2 } },
                }}
              >
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
                    'block w-full text-center py-1 text-base font-medium text-gray-700 font-secondary uppercase transition-colors duration-200',
                    isActive(pathname, section.href ?? '') &&
                      'text-[var(--mid-shade)] font-medium'
                  )}
                >
                  <motion.span
                    variants={navAnimations.drawerItemVariants}
                    initial="initial"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    {section.label}
                  </motion.span>
                </button>
              </motion.li>
            );
          })}
        </motion.ul>
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
  // Added for pre-fetching
  const [initialSearchHits, setInitialSearchHits] = useState<{ objectID: string }[]>([]);

  // Pre-fetch Algolia search results
  useEffect(() => {
    const searchClient = algoliasearch(
      process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
      process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
    );
    const index = searchClient.initIndex('doctors_index');

    index
      .search('', { hitsPerPage: 12 })
      .then(({ hits }) => {
        setInitialSearchHits(hits as { objectID: string }[]);
      })
      .catch((err) => {
        console.error('Failed to pre-fetch Algolia results:', err);
      });
  }, []);

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
            <DoctorSearchDrawer
              key={label}
              allDoctors={allDoctors}
              initialSearchHits={initialSearchHits} // Pass pre-fetched hits
            >
              <motion.div
                className="group relative flex flex-col items-center justify-center z-10 cursor-pointer"
                variants={navAnimations.buttonVariants}
                initial="initial"
                whileHover={prefersReducedMotion ? undefined : "hover"}
                whileTap={prefersReducedMotion ? undefined : (tapVariant as VariantLabels)}
                style={{
                  filter: 'drop-shadow(0_6px_12px_rgba(0,0,0,0.12))_drop-shadow(0_2px_6px_rgba(0,0,0,0.08))',
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