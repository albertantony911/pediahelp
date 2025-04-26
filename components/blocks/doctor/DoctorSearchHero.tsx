"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useSearchBox, useInstantSearch } from "react-instantsearch";
import { debounce } from "lodash";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, X } from "lucide-react";
import { client } from "@/sanity/lib/client";
import { groq } from "next-sanity";
import type { Doctor, Review } from "@/types";
import DoctorList from "./DoctorList";

// Fetch doctors from Sanity
async function fetchDoctors(): Promise<Doctor[]> {
  try {
    const doctors = await client.fetch<Doctor[]>(
      groq`*[_type == "doctor"] | order(orderRank asc) {
        _id, name, specialty, experienceYears, photo { asset->{ _id, url } }, slug, languages,
        appointmentFee, nextAvailableSlot, expertise, searchKeywords, whatsappNumber,
        qualifications { education, achievements, publications, others }
      }`
    );

    return await Promise.all(
      doctors.map(async (doctor) => {
        const reviews = await client.fetch<Review[]>(
          groq`*[_type == "review" && doctor._ref == $id && approved == true] | order(submittedAt desc) {
            _id, name, rating, comment, submittedAt
          }`,
          { id: doctor._id }
        );
        return { ...doctor, reviews };
      })
    );
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return [];
  }
}

interface DoctorSearchHeroProps {
  placeholder?: string;
  onFilterChange?: (hits: { objectID: string }[]) => void;
}

export default function DoctorSearchHero({
  placeholder = "Search by name, specialty, or condition",
  onFilterChange,
}: DoctorSearchHeroProps) {
  const { refine, query } = useSearchBox();
  const { results } = useInstantSearch();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showResetNotice, setShowResetNotice] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const drawerInputRef = useRef<HTMLInputElement>(null);

  const debouncedRefine = useMemo(
    () =>
      debounce((value: string) => {
        setIsSearching(true);
        refine(value);
      }, 50),
    [refine]
  );

  const clearSearch = useCallback(() => {
    refine("");
    setSelectedDoctorId(null);
  }, [refine]);

  const handleDrawerChange = useCallback((open: boolean) => {
    setIsDrawerOpen(open);
    if (!open) clearSearch();
  }, [clearSearch]);

  const handleSearchInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSelectedDoctorId(null);
      if (value === "") {
        clearSearch();
        setIsSearching(false);
      } else {
        debouncedRefine(value);
      }
    },
    [clearSearch, debouncedRefine]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") handleDrawerChange(false);
  }, [handleDrawerChange]);

  const handleBlur = useCallback(() => {
    requestAnimationFrame(() => {
      if (query.trim() && !results?.hits?.length && !selectedDoctorId) {
        refine("");
        setShowResetNotice(true);
        setTimeout(() => setShowResetNotice(false), 2500);
      }
    });
  }, [query, results, refine, selectedDoctorId]);

  useEffect(() => {
    fetchDoctors()
      .then((data) => {
        setDoctors(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load doctors.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isDrawerOpen && drawerInputRef.current) {
      setTimeout(() => drawerInputRef.current?.focus(), 100);
    }
  }, [isDrawerOpen]);

  useEffect(() => {
    if (results) {
      setIsSearching(false);
      const hits = selectedDoctorId
        ? [{ objectID: selectedDoctorId }]
        : (results.hits as { objectID: string }[]);
      onFilterChange?.(hits);
    }
  }, [results, selectedDoctorId, onFilterChange]);

  const filteredDoctors = useMemo(() => {
    if (selectedDoctorId) {
      const doctor = doctors.find((doc) => doc.slug?.current === selectedDoctorId);
      return doctor ? [doctor] : [];
    }
    if (!results?.hits?.length) return doctors;

    return (results.hits as { objectID: string }[])
      .map((hit) => doctors.find((doc) => doc.slug?.current === hit.objectID))
      .filter((doc): doc is Doctor => !!doc);
  }, [results, doctors, selectedDoctorId]);

  const MobileSearchButton = () => (
    <div className="max-w-lg mx-auto px-4 sm:px-0">
      <Button
        onClick={() => setIsDrawerOpen(true)}
        className="w-full bg-gray-100 dark:bg-zinc-800 text-black dark:text-white rounded-full py-5 pl-12 pr-4 text-left text-base font-normal shadow-sm hover:bg-gray-200 dark:hover:bg-zinc-700 focus-visible:ring-2 focus-visible:ring-green-500"
        aria-label="Open doctor search drawer"
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        Search for doctors
      </Button>
    </div>
  );

  const DesktopSearchInput = () => (
    <div className="max-w-lg mx-auto px-4 sm:px-0">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleSearchInput}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-full bg-gray-100 dark:bg-zinc-800 text-black dark:text-white placeholder-gray-500 rounded-full py-5 pl-12 pr-4 shadow-sm focus:ring-2 focus:ring-green-500"
          aria-autocomplete="none"
          aria-label="Search doctors by name, specialty, or condition"
        />
        {query && (
          <Button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent p-1 hover:bg-gray-200 dark:hover:bg-zinc-700"
            aria-label="Clear search"
          >
            <X className="w-5 h-5 text-gray-500" />
          </Button>
        )}
      </div>
      {showResetNotice && (
        <p className="mt-2 text-center text-sm text-gray-500">
          Search reset due to no matches.
        </p>
      )}
    </div>
  );

  if (loading) return <p className="text-center py-8 text-gray-600">Loading doctors...</p>;
  if (error) return <p className="text-center py-8 text-red-400">{error}</p>;

  return (
    <div className="relative max-w-xl mx-auto w-full">
      {isMobile ? <MobileSearchButton /> : <DesktopSearchInput />}

      <Drawer open={isDrawerOpen} onOpenChange={handleDrawerChange}>
        <DrawerOverlay />
        <DrawerContent className="w-full max-w-full m-0 rounded-t-3xl bg-white dark:bg-zinc-950">
          <DrawerHeader className="px-4 pt-2 pb-3">
            <DrawerTitle>Search Doctors</DrawerTitle>
            <DrawerDescription>Find doctors by name, specialty, or condition.</DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                ref={drawerInputRef}
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={handleSearchInput}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className="w-full bg-gray-100 dark:bg-zinc-800 text-black dark:text-white placeholder-gray-500 rounded-full py-2 pl-10 pr-10 focus:ring-2 focus:ring-green-500"
                autoComplete="off"
                aria-autocomplete="none"
                aria-label="Search doctors by name, specialty, or condition"
              />
              {query && (
                <Button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent p-1 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="py-4">
              {isSearching ? (
                <p className="text-center text-gray-500 py-8">Searching...</p>
              ) : query && filteredDoctors.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p>No doctors found for "{query}"</p>
                </div>
              ) : (
                <DoctorList
                  allDoctors={doctors}
                  filteredDoctors={filteredDoctors.length ? filteredDoctors : undefined}
                  loading={false}
                />
              )}
            </div>
          </ScrollArea>

          <DrawerFooter className="px-4 py-3">
            <DrawerClose asChild>
              <Button variant="outline" onClick={() => handleDrawerChange(false)}>
                Close
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}