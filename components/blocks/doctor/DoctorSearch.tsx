'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X, ArrowLeft } from 'lucide-react';
import { debounce } from 'lodash';
import type { Doctor } from '@/types';

interface DrawerSearchProps {
  allDoctors: Doctor[];
  onFilterChange: (filtered: Doctor[]) => void;
}

export default function DrawerDoctorSearch({ allDoctors, onFilterChange }: DrawerSearchProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);

  const searchRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  const debouncedSearch = useRef(
    debounce((searchText: string) => {
      const searchTerms = searchText.toLowerCase().trim().split(/\s+/);
      const results = allDoctors.filter(doctor =>
        searchTerms.every(term => {
          const nameMatch = doctor.name && doctor.name.toLowerCase().includes(term);
          const specialtyMatch = doctor.specialty && doctor.specialty.toLowerCase().includes(term);
          const keywordsMatch = doctor.searchKeywords?.some(keyword =>
            keyword.toLowerCase().includes(term)
          );
          const expertiseMatch = doctor.expertise?.some(exp =>
            exp.toLowerCase().includes(term)
          );
          return nameMatch || specialtyMatch || keywordsMatch || expertiseMatch;
        })
      );
      setFilteredDoctors(results);
      onFilterChange(results);
    }, 200)
  ).current;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(!!value.trim());
    setActiveSuggestion(-1);

    if (value === '') {
      setFilteredDoctors([]);
      onFilterChange([]);
    } else {
      debouncedSearch(value);
    }
  };

  const handleSearchSubmit = () => {
    if (!query.trim()) return;
    debouncedSearch(query.trim());
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.min(prev + 1, filteredDoctors.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestion >= 0 && filteredDoctors[activeSuggestion]) {
        handleSuggestionClick(filteredDoctors[activeSuggestion]);
      } else {
        handleSearchSubmit();
      }
    } else if (e.key === 'Escape') {
      setQuery('');
      setShowSuggestions(false);
      setFilteredDoctors([]);
      onFilterChange([]);
      searchRef.current?.blur();
    }
  };

  const handleSuggestionClick = (doctor: Doctor) => {
    setQuery(doctor.name || '');
    setFilteredDoctors([doctor]);
    onFilterChange([doctor]);
    setShowSuggestions(false);
  };

  const handleClearSearch = () => {
    setQuery('');
    setShowSuggestions(false);
    setFilteredDoctors([]);
    onFilterChange([]);
  };

  return (
    <div className="relative max-w-lg mx-auto px-4 sm:px-0">
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
              placeholder="Search doctors..."
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setIsFocused(true);
                setShowSuggestions(!!query.trim());
              }}
              onClick={() => {
                setIsFocused(true);
                setShowSuggestions(!!query.trim());
              }}
              onBlur={() => {
                setTimeout(() => {
                  setIsFocused(false);
                  setShowSuggestions(false);
                }, 200);
              }}
              className={`w-full bg-gray-100 dark:bg-zinc-800 text-black dark:text-white placeholder-gray-500 rounded-full py-5 transition-all ${
                isFocused
                  ? 'pl-12 pr-12 shadow-md border-green-500'
                  : 'pl-12 pr-4 shadow-sm border-transparent'
              }`}
              aria-autocomplete="list"
              aria-controls="suggestions-list"
              aria-expanded={showSuggestions}
            />

            {!isFocused && (
              <div className="absolute left-3 text-gray-500">
                <Search className="w-5 h-5" />
              </div>
            )}

            {query.trim() && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {showSuggestions && query.trim() && (
          <div className="w-full bg-white dark:bg-zinc-900 rounded-lg shadow-md mt-3 text-black dark:text-white border border-gray-200 dark:border-zinc-700">
            <ul
              ref={suggestionsRef}
              id="suggestions-list"
              role="listbox"
              className="p-2"
            >
              {filteredDoctors.length === 0 ? (
                <li className="py-4 text-center text-gray-500 dark:text-gray-400">
                  No matching doctors found.
                </li>
              ) : (
                filteredDoctors.slice(0, 5).map((doctor, index) => {
                  const isActive = activeSuggestion === index;
                  return (
                    <li
                      key={doctor.slug?.current || index}
                      onClick={() => handleSuggestionClick(doctor)}
                      onMouseEnter={() => setActiveSuggestion(index)}
                      className={`p-2 rounded-md cursor-pointer ${
                        isActive
                          ? 'bg-gray-100 dark:bg-zinc-800'
                          : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                      }`}
                      role="option"
                      aria-selected={isActive}
                    >
                      <div className="truncate font-medium max-w-[200px]">
                        {doctor.name}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}