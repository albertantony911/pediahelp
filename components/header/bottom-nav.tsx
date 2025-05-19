'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import algoliasearch from 'algoliasearch/lite';
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
  DrawerContent,
  DrawerTitle,
  DrawerHeader,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import DoctorSearch from '@/components/blocks/doctor/DoctorSearch';
import DoctorList from '@/components/blocks/doctor/DoctorList';
import type { Doctor } from '@/types';

type NavDrawer = 'doctor-search' | 'more';

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!;
const ALGOLIA_INDEX = 'doctors_index';
const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
const index = algoliaClient.initIndex(ALGOLIA_INDEX);

const navItems = [
  { label: 'Home', href: '/', icon: House },
  { label: 'Resources', href: '/blog', icon: Book },
  { label: 'Consult', icon: CalendarPlus, drawer: 'doctor-search', primary: true },
  {
    label: 'Help',
    icon: ChatTeardropText,
    action: () => {
      const link = `https://wa.me/+919970450260?text=Hi,%20I%20need%20help!`;
      window.open(link, '_blank');
    },
  },
  { label: 'More', icon: List, drawer: 'more' },
];

const overflowItems = [
  { label: 'Home', href: '/', type: 'item' },
  { label: 'About', href: '/about', type: 'item' },
  { label: 'Consultation', href: '/consultation', type: 'item' },
  { label: 'Resources', href: '/blogs', type: 'item' },
  { label: 'Contact', href: '/contact', type: 'item' },
  {
    label: 'Specialities',
    type: 'group' as const,
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

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerMode, setDrawerMode] = useState<NavDrawer | null>(null);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [drawerJustClosed, setDrawerJustClosed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Reset drawer mode on route change
  useEffect(() => {
    setDrawerMode(null);
  }, [pathname]);

  // Fetch doctors from Algolia when drawer opens
  useEffect(() => {
    if (drawerMode === 'doctor-search') {
      let didCancel = false;

      (async () => {
        try {
          setLoading(true);
          const result = await index.search<Doctor>('', { hitsPerPage: 100 });
          if (!didCancel) {
            const mapped = result.hits.map((hit) => ({ ...hit, _id: hit.objectID }));
            setAllDoctors(mapped);
          }
        } catch (err) {
          if (!didCancel) setError('Failed to load doctors.');
        } finally {
          if (!didCancel) setLoading(false);
        }
      })();

      return () => {
        didCancel = true;
      };
    }
  }, [drawerMode]);

  useEffect(() => {
  if (drawerJustClosed) {
    const timeout = setTimeout(() => {
      setDrawerMode(null);
      setFilteredDoctors([]);
      setAllDoctors([]);
      setDrawerJustClosed(false); // ✅ reset flag
    }, 400); // 🕐 match your drawer animation duration

    return () => clearTimeout(timeout);
  }
}, [drawerJustClosed]);

  const handleFilterChange = useCallback((filtered: Doctor[]) => {
    setFilteredDoctors(filtered);
  }, []);

  const handleNavClick = (href: string) => {
    navigator.vibrate?.([10]);
    setTimeout(() => router.push(href), 150);
  };

  const handleDrawerOpen = (mode: string) => {
    navigator.vibrate?.([10]);
    setTimeout(() => setDrawerMode(mode as NavDrawer), 150);
  };

  const handleScroll = () => {
    if (scrollRef.current?.scrollTop && scrollRef.current.scrollTop < -30) {
      setDrawerMode(null);
    }
  };

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
      {navItems.map(({ label, href, icon: Icon, drawer, action, primary }) => {
        const active = href ? pathname === href : false;

        const handleClick = () => {
          if (drawer) return handleDrawerOpen(drawer);
          if (action) return action();
          if (href) return handleNavClick(href);
        };

        return primary ? (
          <button key={label} aria-label={label} onClick={handleClick} className="group relative flex flex-col items-center justify-center">
            <span className="w-16 h-16 rounded-full flex items-center justify-center bg-[var(--mid-shade)] text-white animate-floatPulse hover:scale-100 active:scale-95 active:shadow-inner transition-all duration-200 ease-out shadow-[0_6px_10px_rgba(0,0,0,0.5)] focus-visible:ring-2 ring-offset-2 ring-[var(--mid-shade)]">
              <Icon weight="fill" className="w-[28px] h-[28px] drop-shadow-sm group-hover:scale-105 transition-transform" />
            </span>
          </button>
        ) : (
          <button
            key={label}
            aria-label={label}
            onClick={handleClick}
            aria-expanded={drawer ? drawerMode === drawer : undefined}
            className={cn(
              'group relative w-16 h-full flex flex-col items-center justify-center z-10',
              active ? 'text-[var(--mid-shade)]' : 'text-[var(--dark-shade)] opacity-75'
            )}
          >
            <Icon weight="fill" className="w-7 h-7 group-hover:scale-110 group-active:scale-95 transition-transform" />
            <span className="text-[11px] mt-1">{label}</span>
          </button>
        );
      })}

      <Drawer
  open={!!drawerMode}
  onOpenChange={(open) => {
    if (!open) {
      setDrawerJustClosed(true); // ✅ delay cleanup via useEffect
    }
  }}
>
  <DrawerContent className="max-h-[90vh] overflow-hidden rounded-t-[2.5rem] shadow-2xl transition-all duration-500 ease-in-out">
    {drawerMode === 'doctor-search' && (
      <div className="mx-auto w-full max-w-2xl flex flex-col h-[90vh]">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading doctors...</div>
        ) : error || !allDoctors.length ? (
          <div className="text-center text-red-400 py-8">{error || 'No doctors found.'}</div>
        ) : (
          <>
            <DrawerHeader className="sticky top-0 z-20 flex flex-col items-center bg-background/80 backdrop-blur-md pt-3 pb-5">
              <p className="text-[0.65rem] text-muted-foreground tracking-wide mb-1">Pull down to close</p>
              <div className="w-full">
                <DoctorSearch
                  allDoctors={allDoctors}
                  onFilterChange={handleFilterChange}
                />
              </div>
            </DrawerHeader>

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 scrollbar-hide transition-opacity duration-300 ease-in-out"
            >
              <DoctorList
                allDoctors={allDoctors}
                filteredDoctors={
                  filteredDoctors.length ? filteredDoctors : undefined
                }
              />
            </div>
          </>
        )}
      </div>
    )}

    {drawerMode === 'more' && (
      <div className="overflow-y-auto max-h-[calc(90vh-3rem)] px-6 pt-4 pb-16">
        <ul className="space-y-4">
          {overflowItems.map((section, idx) => {
            const isOpen = openIndex === idx;

            if (section.type === 'group') {
              return (
                <li key={section.label}>
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-base font-semibold rounded-xl bg-muted/30 text-[var(--dark-shade)] hover:bg-muted"
                  >
                    <CaretDown
                      className={`size-4 text-muted-foreground transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                    {section.label}
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen
                        ? 'max-h-[800px] opacity-100'
                        : 'max-h-0 opacity-0'
                    }`}
                  >
                    <ul className="flex flex-col px-7 pb-2 pt-1 space-y-2">
                      {section.items!.map((item) => (
                        <li key={item.label}>
                          <button
                            onClick={() => router.push(item.href!)}
                            className={cn(
                              'block w-full text-left px-3 py-3 rounded-md font-medium text-sm bg-white hover:bg-muted',
                              pathname === item.href &&
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
                  onClick={() => router.push(section.href!)}
                  className={cn(
                    'block w-full text-left px-4 py-4 text-base font-semibold rounded-xl bg-muted/30 text-[var(--dark-shade)] hover:bg-muted',
                    pathname === section.href &&
                      'text-[var(--mid-shade)] bg-muted font-semibold'
                  )}
                >
                  {section.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    )}
  </DrawerContent>
</Drawer>



    </nav>
  );
}