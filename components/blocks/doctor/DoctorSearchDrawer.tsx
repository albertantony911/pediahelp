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
import { motion, AnimatePresence } from 'framer-motion';

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
);

interface Props {
  children: React.ReactNode;
  allDoctors: Doctor[];
}

export function DoctorSearchDrawer({ children, allDoctors }: Props) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchHits, setSearchHits] = useState<{ objectID: string }[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const previousPath = useRef(pathname);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (drawerOpen && pathname !== previousPath.current) {
      setDrawerOpen(false);
    }
    previousPath.current = pathname;
  }, [pathname, drawerOpen]);

  // Reset search state when drawer opens/closes
  useEffect(() => {
    if (drawerOpen) {
      setSearchHits([]);
      setIsInitialLoad(true);
      // Small delay to ensure search component is ready
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Reset state when drawer closes to prevent jitter on next open
      setSearchHits([]);
      setIsInitialLoad(true);
    }
  }, [drawerOpen]);

  const handleFilterChange = useCallback((hits: { objectID: string }[]) => {
    setSearchHits(hits);
    setIsInitialLoad(false);
  }, []);

  const filteredDoctors = useMemo(() => {
    // Show all doctors initially or when no search hits
    if (isInitialLoad || !searchHits.length) {
      return allDoctors;
    }
    
    const idSet = new Set(searchHits.map((hit) => hit.objectID));
    const filtered = allDoctors.filter((doc) => {
      // Ensure doc.slug exists and has current property
      return doc.slug?.current && idSet.has(doc.slug.current);
    });
    
    return filtered;
  }, [searchHits, allDoctors, isInitialLoad]);

  // Scroll to top on new search (but not during closing)
  useEffect(() => {
    if (!isInitialLoad && scrollRef.current && drawerOpen) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchHits, isInitialLoad, drawerOpen]);

  // Handle case where allDoctors might be empty or undefined
  const shouldShowList = filteredDoctors && filteredDoctors.length > 0;
  const shouldShowEmptyState = !isInitialLoad && !shouldShowList;

  return (
    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className="max-h-[90vh] overflow-hidden rounded-t-[2.5rem] shadow-xl backdrop-blur-sm">
        <DrawerTitle className="sr-only">Search for Doctors</DrawerTitle>
        <div className="mx-auto w-full max-w-2xl flex flex-col h-[90vh]">
          <InstantSearch searchClient={searchClient} indexName="doctors_index">
            <Configure hitsPerPage={12} />
            <DrawerHeader className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pt-3 pb-3 border-b border-border/50">
              <DrawerDoctorSearch
                allDoctors={allDoctors}
                onFilterChange={handleFilterChange}
              />
            </DrawerHeader>
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto max-h-[calc(90vh-6.5rem)] px-4 pt-4 pb-12 scrollbar-hide"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isInitialLoad ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-center text-sm text-zinc-500 mt-10"
                  >
                    Loading doctors...
                  </motion.div>
                ) : shouldShowList ? (
                  <motion.div
                    key="doctor-list"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <DoctorList
                      allDoctors={allDoctors}
                      filteredDoctors={filteredDoctors}
                    />
                  </motion.div>
                ) : shouldShowEmptyState ? (
                  <motion.div
                    key="no-doctors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-center text-sm text-zinc-500 mt-10"
                  >
                    No doctors found.
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </InstantSearch>
        </div>
      </DrawerContent>
    </Drawer>
  );
}