'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchBox, useInstantSearch } from 'react-instantsearch';
import { Input } from '@/components/ui/input';
import { Search, X, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { debounce } from 'lodash';

interface Doctor {
  objectID: string;
  name: string;
  specialty?: string;
  photoUrl?: string;
}

interface Props {
  onFilterChange: (filtered: { objectID: string }[]) => void;
  selectedSpecialty: string | null;
}

const specialtyToAlgoliaMap: Record<string, string> = {
  'pediatric nephrology': 'nephrology',
  'pediatric gastroenterology': 'gastroenterology',
  'neonatology': 'neonatology',
  'pediatric neurology': 'neurology',
  'lactation consultant': 'lactation',
  'pediatric respiratory medicine and sleep medicine': 'respiratory_and_sleep',
  'pediatric endocrinology': 'endocrinology',
};

export default function DoctorSearchAlgolia({ onFilterChange, selectedSpecialty }: Props) {
  const { refine } = useSearchBox();
  const { results } = useInstantSearch();

  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const ulRef = useRef<HTMLUListElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);

  const debouncedSetInputValue = useMemo(
    () => debounce((val: string) => setInputValue(val), 200),
    []
  );

  useEffect(() => {
    const trimmed = inputValue.trim();
    if (trimmed === '') {
      refine('');
      setIsSearching(false);
      onFilterChange([]);
    } else {
      setIsSearching(true);
      refine(trimmed);
    }
  }, [inputValue]);

  useEffect(() => {
    if (selectedSpecialty) {
      const algoliaSpecialty = specialtyToAlgoliaMap[selectedSpecialty.toLowerCase()] || selectedSpecialty.toLowerCase();
      setInputValue(algoliaSpecialty);
      setIsFocused(true);
      setShowSuggestions(true);
      inputRef.current?.focus();
      scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedSpecialty]);

  useEffect(() => {
    if (results?.hits && Array.isArray(results.hits)) {
      const hits = results.hits as Doctor[];
      onFilterChange(hits.map(hit => ({ objectID: hit.objectID })));
      setIsSearching(false);
    }
  }, [results]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(!!value.trim());
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const hits = (results?.hits as Doctor[]) || [];
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && hits[activeIndex]) {
        setInputValue(hits[activeIndex].name);
        setShowSuggestions(false);
        onFilterChange([{ objectID: hits[activeIndex].objectID }]);
      }
    } else if (e.key === 'Escape') {
      setInputValue('');
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    let pasted = e.clipboardData.getData('text').trim().toLowerCase();
    debouncedSetInputValue(pasted);
    setShowSuggestions(true);
    setIsFocused(true);
  };

  const handleClear = () => {
    setInputValue('');
    setShowSuggestions(false);
    setIsSearching(false);
    onFilterChange([]);
  };

  const renderSuggestionItem = (doctor: Doctor, index: number) => {
    const isActive = activeIndex === index;
    return (
      <motion.li
        key={doctor.objectID}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        onClick={() => {
          setInputValue(doctor.name);
          setShowSuggestions(false);
          onFilterChange([{ objectID: doctor.objectID }]);
        }}
        onMouseEnter={() => setActiveIndex(index)}
        className={cn(
          'p-2 rounded-md cursor-pointer flex items-center gap-3',
          isActive ? 'bg-gray-100 dark:bg-zinc-800' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
        )}
        role="option"
        aria-selected={isActive}
      >
        <div className="w-[36px] aspect-[3/4] h-10 rounded-md bg-zinc-200 overflow-hidden shrink-0 border border-zinc-300 dark:border-zinc-700">
          {doctor.photoUrl ? (
            <img src={doctor.photoUrl} alt={doctor.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
              <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                {doctor.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col overflow-hidden text-sm">
          <div className="truncate font-medium max-w-[160px]">{doctor.name}</div>
          {doctor.specialty && (
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{doctor.specialty}</div>
          )}
        </div>
      </motion.li>
    );
  };

  return (
    <div className="relative max-w-sm mx-auto px-4 sm:px-0">
      <div className={cn('transition-all duration-200', { 'my-2': isFocused })}>
        <div
          className={cn(
            'flex items-center relative bg-white rounded-full border border-zinc-200 shadow-sm transition-all duration-300',
            { 'animate-glow border-[var(--mid-shade)] ring-2 ring-[var(--mid-shade)]': isSearching }
          )}
        >
          {isFocused && (
            <button
              className="absolute left-3 text-zinc-400 hover:text-zinc-600 p-1"
              onClick={() => {
                setIsFocused(false);
                setShowSuggestions(false);
                inputRef.current?.blur();
              }}
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <Input
            ref={inputRef}
            type="text"
            placeholder="Search by name, specialty, or condition"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(!!inputValue.trim());
            }}
            onClick={() => {
              setIsFocused(true);
              setShowSuggestions(!!inputValue.trim());
            }}
            onBlur={() => {
              setTimeout(() => {
                setIsFocused(false);
                setShowSuggestions(false);
              }, 150);
            }}
            className={cn(
              'w-full text-zinc-800 placeholder-zinc-400 rounded-full',
              'placeholder:text-sm md:placeholder:text-base',
              'py-5 transition-all focus:ring-[var(--mid-shade)] focus:ring-2 focus:border-[var(--mid-shade)]',
              { 'pl-12 pr-12 shadow-md': isFocused, 'pl-12 pr-4 shadow-sm': !isFocused },
              { 'opacity-70': isSearching }
            )}
            aria-autocomplete="list"
            aria-controls="suggestions-list"
            aria-expanded={showSuggestions}
          />

          {!isFocused && (
            <div className="absolute left-3 text-zinc-400">
              <Search className="w-5 h-5" />
            </div>
          )}

          {isSearching ? (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 animate-spin">
              <Loader2 className="w-5 h-5" />
            </div>
          ) : (
            inputValue.trim() && (
              <button
                onClick={handleClear}
                className="absolute right-3 text-zinc-400 hover:text-zinc-600 p-2"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )
          )}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {showSuggestions && inputValue.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="w-full bg-white dark:bg-zinc-900 rounded-lg shadow-md mt-2 text-black dark:text-white border border-gray-200 dark:border-zinc-700"
          >
            <ul ref={ulRef} id="suggestions-list" role="listbox" className="p-1">
              {(results?.hits as Doctor[])?.length === 0 ? (
                <motion.li
                  key="no-doctors"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="py-3 text-center text-gray-500 dark:text-gray-400 text-sm"
                >
                  No matching doctors found.
                </motion.li>
              ) : (
                (results?.hits as Doctor[])?.slice(0, 6).map(renderSuggestionItem)
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={scrollAnchorRef} className="mt-5" />
    </div>
  );
}
