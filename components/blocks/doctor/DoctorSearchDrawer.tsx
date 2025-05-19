'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import algoliasearch from 'algoliasearch/lite';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerTitle,
  DrawerHeader,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import DoctorList from '@/components/blocks/doctor/DoctorList';
import DoctorSearch from '@/components/blocks/doctor/DoctorSearch';
import type { Doctor } from '@/types';

type Props = {
  children: React.ReactNode;
};

const ALGOLIA_APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!;
const ALGOLIA_SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!;
const ALGOLIA_INDEX = 'doctors_index';

const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_KEY);
const index = algoliaClient.initIndex(ALGOLIA_INDEX);

export function DoctorSearchDrawer({ children }: Props) {
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch doctors from Algolia on mount
  useEffect(() => {
    async function fetchDoctors() {
      try {
        const result = await index.search<Doctor>('', { hitsPerPage: 100 });
        const mappedHits = result.hits.map((hit) => ({ ...hit, _id: hit.objectID }));
        setAllDoctors(mappedHits);
      } catch (err) {
        console.error('Algolia fetch error:', err);
        setError('Failed to load doctors. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, []);

  const handleFilterChange = useCallback((filtered: Doctor[]) => {
    setFilteredDoctors(filtered);
  }, []);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    if (scrollRef.current.scrollTop < -30) {
      const closeBtn = document.querySelector('[data-drawer-close]');
      if (closeBtn instanceof HTMLElement) closeBtn.click();
    }
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent className="max-h-[90vh] overflow-hidden rounded-t-[2.5rem] shadow-2xl">
        <DrawerTitle className="sr-only">Search for Doctors</DrawerTitle>

        <div className="mx-auto w-full max-w-2xl flex flex-col h-[90vh]">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading doctors...</div>
          ) : error || !allDoctors.length ? (
            <div className="text-center text-red-400 py-8">
              {error || 'No doctors found.'}
            </div>
          ) : (
            <>
              <DrawerHeader className="sticky top-0 z-20 flex flex-col items-center bg-background/80 backdrop-blur-md border-b pt-3 pb-2">
                <p className="text-xs text-muted-foreground tracking-wide mb-2">Pull down to close</p>
                <div className="w-full px-4">
                  <DoctorSearch allDoctors={allDoctors} onFilterChange={handleFilterChange} />
                </div>
              </DrawerHeader>

              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 pt-4 scrollbar-hide"
              >
                <DoctorList
                  allDoctors={allDoctors}
                  filteredDoctors={filteredDoctors.length ? filteredDoctors : undefined}
                />
              </div>

              <DrawerFooter className="sticky bottom-0 bg-background/80 backdrop-blur-md px-4 py-6 border-t">
                <DrawerClose asChild>
                  <Button
                    variant="outline"
                    className="w-full font-semibold hover:bg-muted transition"
                    data-drawer-close
                  >
                    Close
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}