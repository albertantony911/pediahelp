'use client';

import React, { useState, useEffect, useRef, ChangeEvent, KeyboardEvent } from 'react';
import { useSearchBox, useInstantSearch } from 'react-instantsearch';
import { debounce } from 'lodash';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Search, X, ArrowLeft, SlidersHorizontal } from 'lucide-react';

interface Doctor {
  objectID: string;
  name: string;
  specialty?: string;
  photoUrl?: string;
  slug?: string;
}

interface DoctorSearchHeroProps {
  placeholder?: string;
  maxSuggestions?: number;
  onResultSelect?: (doctor: Doctor) => void;
}

export default function DoctorSearchHero({
  placeholder = 'Search by name, specialty, or condition',
  maxSuggestions = 5,
  onResultSelect,
}: DoctorSearchHeroProps) {
  const { refine } = useSearchBox();
  const { results } = useInstantSearch();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showResetNotice, setShowResetNotice] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showRedirectDialog, setShowRedirectDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);
  const RECENT_KEY = 'recentDoctorSearches';

  useEffect(() => {
    const saved = localStorage.getItem(RECENT_KEY);
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 4));
    }
  }, []);

  useEffect(() => {
    if (results?.hits) {
      console.log('Algolia search results:', JSON.stringify(results.hits, null, 2));
      const drSeher = (results.hits as Doctor[]).find((d) => d.name === 'Dr Seher Kamal');
      if (drSeher) {
        console.log('Dr Seher Kamal in results:', drSeher);
      }
    }
    if (results?.hits?.length === 0 && searchQuery.trim()) {
      setSelectedDoctor(null);
    }
  }, [results, searchQuery]);

  const debouncedRefine = useRef(
    debounce((value: string) => {
      setIsSearching(true);
      refine(value);
    }, 50)
  ).current;

  const updateRecentSearches = (query: string) => {
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 4);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    setRecentSearches(updated);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(!!value.trim());
    setActiveSuggestion(-1);
    setSelectedDoctor(null);
    if (value === '') {
      refine('');
      setIsSearching(false);
    } else {
      debouncedRefine(value);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const hits = (results?.hits as Doctor[]) || [];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestion((prev) => Math.min(prev + 1, hits.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestion((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        const selected = hits[activeSuggestion];
        if (selected) {
          console.log('Enter pressed with selected doctor:', JSON.stringify(selected, null, 2));
          refine(selected.name);
          setSearchQuery(selected.name);
          updateRecentSearches(selected.name);
          setSelectedDoctor(selected);
          if (onResultSelect) onResultSelect(selected);
          goToDoctorProfile();
        } else {
          console.log('Enter pressed without selection, query:', searchQuery);
          goToDoctorProfile();
        }
        setShowSuggestions(false);
        break;
      case 'Escape':
        refine('');
        setSearchQuery('');
        setShowSuggestions(false);
        searchRef.current?.blur();
        break;
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
      const hits = (results?.hits as Doctor[]) || [];
      if (searchQuery.trim() && hits.length === 0) {
        refine('');
        setSearchQuery('');
        setShowResetNotice(true);
        setTimeout(() => setShowResetNotice(false), 2500);
      }
    }, 200);
  };

  const handleSuggestionClick = (doctor: Doctor) => {
    console.log('Suggestion clicked:', JSON.stringify(doctor, null, 2));
    refine(doctor.name);
    setSearchQuery(doctor.name);
    updateRecentSearches(doctor.name);
    setSelectedDoctor(doctor);
    setShowSuggestions(false);
    if (onResultSelect) onResultSelect(doctor);
    goToDoctorProfile();
  };

  const handleRecentClick = (search: string) => {
    refine(search);
    setSearchQuery(search);
    setShowSuggestions(true);
  };

  const goToDoctorProfile = () => {
    const trimmedQuery = searchQuery.trim();

    console.log('goToDoctorProfile called. SelectedDoctor:', JSON.stringify(selectedDoctor, null, 2), 'Query:', trimmedQuery);

    if (!trimmedQuery && !selectedDoctor) {
      console.log('No query or selected doctor, showing reset notice');
      setShowResetNotice(true);
      setTimeout(() => setShowResetNotice(false), 2500);
      return;
    }

    // First try with slug
    if (selectedDoctor?.slug) {
      console.log('Navigating to doctor profile with slug:', selectedDoctor.slug);
      router.push(`/consultation/${selectedDoctor.slug}`);
      return;
    }
    
    // Fallback to objectID if slug is missing
    if (selectedDoctor?.objectID) {
      console.log('Fallback: Using objectID as slug:', selectedDoctor.objectID);
      router.push(`/consultation/${selectedDoctor.objectID}`);
      return;
    }

    // Last resort fallback
    console.log('Falling back to consultation page. SelectedDoctor:', selectedDoctor);
    setShowRedirectDialog(true);
    setTimeout(() => {
      setShowRedirectDialog(false);
      router.push(trimmedQuery ? `/consultation?query=${encodeURIComponent(trimmedQuery)}` : '/consultation');
      refine('');
      setSearchQuery('');
      setSelectedDoctor(null);
    }, 1500);
  };

  return (
    <div className="relative max-w-xl mx-auto px-4 sm:px-0">
      <div className="relative">
        <div className={`transition-all duration-200 ${isFocused ? 'my-2' : ''}`}>
          <div className="flex items-center relative bg-white dark:bg-zinc-900 rounded-full">
            {isFocused && (
              <button
                className="absolute left-3 text-gray-400 hover:text-white p-1"
                onClick={() => {
                  setIsFocused(false);
                  setShowSuggestions(false);
                  searchRef.current?.blur();
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <Input
              ref={searchRef}
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.scrollBy({ top: -100, behavior: 'smooth' });
                setIsFocused(true);
                setShowSuggestions(!!searchQuery.trim() || recentSearches.length > 0);
              }}
              onClick={() => {
                setIsFocused(true);
                setShowSuggestions(!!searchQuery.trim() || recentSearches.length > 0);
              }}
              onBlur={handleBlur}
              className={`w-full bg-gray-100 dark:bg-zinc-800 text-black dark:text-white placeholder-gray-500 rounded-full py-5 transition-all ${
                isFocused
                  ? 'pl-12 pr-12 shadow-md border-green-500'
                  : 'pl-12 pr-4 shadow-sm border-transparent'
              } ${isSearching ? 'opacity-70' : ''}`}
            />

            {!isFocused && (
              <div className="absolute left-3 text-gray-500">
                <Search className="w-5 h-5" />
              </div>
            )}

            {searchQuery.trim() && (
              <button
                onClick={() => {
                  refine('');
                  setSearchQuery('');
                  setShowSuggestions(false);
                }}
                className="absolute right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {showSuggestions && searchQuery.trim() && (
          <div className="w-full bg-white dark:bg-zinc-900 rounded-lg shadow-md mt-3 text-black dark:text-white border border-gray-200 dark:border-zinc-700">
            <ul ref={suggestionsRef} className="p-2" role="listbox">
              {(results?.hits as Doctor[])?.length === 0 ? (
                <li className="py-4 text-center text-gray-500 dark:text-gray-400">
                  No matching doctors found.
                </li>
              ) : (
                (results?.hits as Doctor[]).slice(0, maxSuggestions).map((doctor, index) => (
                  <li
                    key={doctor.objectID}
                    onClick={() => handleSuggestionClick(doctor)}
                    onMouseEnter={() => setActiveSuggestion(index)}
                    className={`flex items-center p-2 rounded-md cursor-pointer ${
                      activeSuggestion === index
                        ? 'bg-gray-100 dark:bg-zinc-800'
                        : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                    }`}
                    role="option"
                    aria-selected={activeSuggestion === index}
                  >
                    <div className="bg-gray-200 dark:bg-zinc-700 w-[40px] aspect-[2/3] rounded-md overflow-hidden mr-3 shrink-0">
                      {doctor.photoUrl ? (
                        <img src={doctor.photoUrl} alt={doctor.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xl font-semibold text-gray-500">{doctor.name.charAt(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <div className="font-medium truncate max-w-[200px]">{doctor.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                        {doctor.specialty || '—'}
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {isFocused && !searchQuery.trim() && recentSearches.length > 0 && (
          <div className="w-full bg-white dark:bg-zinc-900 rounded-lg shadow-md mt-3 text-black dark:text-white border border-gray-200 dark:border-zinc-700">
            <ul className="p-2" role="listbox">
              {recentSearches.map((search, index) => (
                <li
                  key={index}
                  onClick={() => handleRecentClick(search)}
                  className="p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800"
                  role="option"
                >
                  <div className="truncate max-w-[200px]">{search}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {showResetNotice && (
          <div className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
            Please enter a search query or select a doctor.
          </div>
        )}

        <div className="mt-6 flex gap-3 justify-center">
          <Button onClick={goToDoctorProfile} className="rounded-full px-6">
            Search
          </Button>

          <Button variant="outline" className="rounded-full px-6" onClick={() => setIsDrawerOpen(true)}>
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="px-6 pb-8 pt-6 rounded-t-2xl border-t border-muted bg-background">
          <DrawerHeader>
            <DrawerTitle className="text-xl font-bold">Filter Doctors</DrawerTitle>
          </DrawerHeader>
          <div className="mt-6 space-y-4 text-muted-foreground">Coming soon: specialty, ratings, etc.</div>
          <div className="mt-8 flex justify-end">
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </div>
        </DrawerContent>
      </Drawer>

      <AlertDialog open={showRedirectDialog} onOpenChange={setShowRedirectDialog}>
        <AlertDialogContent className="max-w-sm animate-fade-in text-center">
          <AlertDialogHeader>
            <AlertDialogTitle>Redirecting...</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-muted-foreground text-sm mt-2">Taking you to the doctor search page.</p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}