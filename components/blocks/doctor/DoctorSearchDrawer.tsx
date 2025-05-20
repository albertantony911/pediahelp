'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerTitle,
  DrawerHeader,
} from '@/components/ui/drawer';
import { usePathname } from 'next/navigation';
import DoctorList from '@/components/blocks/doctor/DoctorList';
import DrawerDoctorSearch from '@/components/blocks/doctor/DoctorSearch';
import type { Doctor } from '@/types';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, Configure } from 'react-instantsearch';

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
);

type Props = {
  children: React.ReactNode;
  allDoctors: Doctor[];
};

export function DoctorSearchDrawer({ children, allDoctors }: Props) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchHits, setSearchHits] = useState<{ objectID: string }[]>([]);
  const previousPath = useRef(pathname);

  useEffect(() => {
    if (drawerOpen && pathname !== previousPath.current) {
      setDrawerOpen(false);
    }
    previousPath.current = pathname;
  }, [pathname, drawerOpen]);

  const filteredDoctors = useMemo(() => {
    if (!searchHits.length) return [];
    const ids = new Set(searchHits.map((hit) => hit.objectID));
    return allDoctors.filter((doc) => ids.has(doc.slug.current));
  }, [searchHits, allDoctors]);

  const handleFilterChange = useCallback((hits: { objectID: string }[]) => {
    setSearchHits(hits);
  }, []);

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>

      <DrawerContent className="max-h-[90vh] overflow-hidden rounded-t-[2.5rem] shadow-xl backdrop-blur-sm">
        <DrawerTitle className="sr-only">Search for Doctors</DrawerTitle>
        <div className="mx-auto w-full max-w-2xl flex flex-col h-[90vh]">
          <InstantSearch searchClient={searchClient} indexName="doctors_index">
            <Configure hitsPerPage={12} />
            <DrawerHeader className="sticky top-0 z-20 bg-background/80 backdrop-blur-md pt-3 pb-3">
              <DrawerDoctorSearch allDoctors={allDoctors} onFilterChange={handleFilterChange} />
            </DrawerHeader>
            <div className="relative flex-1 min-h-0 overflow-y-auto px-4 pt-4 scrollbar-hide">
              <DoctorList
                allDoctors={allDoctors}
                filteredDoctors={filteredDoctors.length ? filteredDoctors : undefined}
              />
            </div>
          </InstantSearch>
        </div>
      </DrawerContent>
    </Drawer>
  );
}