// components/blocks/doctor/DoctorSearch.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { debounce } from 'lodash';
import Fuse from 'fuse.js';
import { Input } from '@/components/ui/input';
import { Search, X, ArrowLeft } from 'lucide-react';
import { Doctor } from '@/types';

interface DoctorSearchProps {
  allDoctors: Doctor[];
  onFilterChange: (filteredDoctors: Doctor[]) => void;
  initialSearchQuery?: string;
}

export default function DoctorSearch({
  allDoctors,
  onFilterChange,
  initialSearchQuery = '',
}: DoctorSearchProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  // Create a Fuse instance typed for Doctor data
  const fuse = useMemo(
    () =>
      new Fuse<Doctor>(allDoctors, {
        keys: ['name', 'specialty'],
        threshold: 0.3,
      }),
    [allDoctors]
  );

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentDoctorSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches).slice(0, 4));
    }
  }, []);

  // Auto-focus on mount
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Save search to recent searches
  const saveToRecentSearches = (query: string) => {
    if (!query.trim()) return;

    setRecentSearches((prev) => {
      const newSearches = [query, ...prev.filter((s) => s !== query)].slice(0, 4);
      localStorage.setItem('recentDoctorSearches', JSON.stringify(newSearches));
      return newSearches;
    });
  };

  // Debounced search handler to update filtered list using Fuse
  const handleSearch = useCallback(
    debounce((query: string) => {
      if (!query.trim()) {
        onFilterChange(allDoctors);
        return;
      }
      const results = fuse.search(query);
      const finalDoctors = results.map((r) => r.item);
      onFilterChange(finalDoctors.length ? finalDoctors : []);
    }, 300),
    [allDoctors, onFilterChange, fuse]
  );

  // Compute suggestions (top 5 search results)
  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const results = fuse.search(searchQuery);
    return results.map((r) => r.item).slice(0, 5);
  }, [searchQuery, fuse]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setShowSuggestions(true);
    setActiveSuggestion(-1);
    handleSearch(query);
  };

  // Submit search
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      const results = fuse.search(searchQuery);
      const finalDoctors = results.map((r) => r.item);
      onFilterChange(finalDoctors.length ? finalDoctors : []);
      saveToRecentSearches(searchQuery);
      setShowSuggestions(false);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestion >= 0 && activeSuggestion < filteredSuggestions.length) {
        handleSuggestionClick(filteredSuggestions[activeSuggestion]);
      } else {
        handleSearchSubmit();
      }
    } else if (e.key === 'Escape') {
      setActiveSuggestion(-1);
      setSearchQuery('');
      onFilterChange(allDoctors);
      setShowSuggestions(false);
      searchRef.current?.blur();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (doctor: Doctor) => {
    setSearchQuery(doctor.name);
    onFilterChange([doctor]);
    saveToRecentSearches(doctor.name);
    setShowSuggestions(false);
  };

  // Handle recent search click
  const handleRecentSearchClick = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
    setShowSuggestions(false);
  };

  // Clear a single recent search
  const clearRecentSearch = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const newSearches = [...prev];
      newSearches.splice(index, 1);
      localStorage.setItem('recentDoctorSearches', JSON.stringify(newSearches));
      return newSearches;
    });
  };

  // Scroll to top on focus
  const handleFocus = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchFocused(true);
    setShowSuggestions(true);
  };

  return (
    <div className="relative max-w-lg mx-auto px-4 sm:px-0">
      <div className="relative">
        {/* Search input with Spotify-style appearance */}
        <div className={`relative transition-all duration-200 ${searchFocused ? 'my-2' : ''}`}>
          <div className="flex items-center relative bg-white dark:bg-zinc-900 rounded-full">
            {/* Back arrow (visible when focused) */}
            {searchFocused && (
              <button
                className="absolute left-3 text-gray-400 hover:text-white p-1"
                onClick={() => {
                  setSearchFocused(false);
                  setShowSuggestions(false);
                  searchRef.current?.blur();
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            {/* Search input */}
            <Input
              ref={searchRef}
              type="text"
              placeholder="search by doctor name/specialty"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onClick={handleFocus} // Also scroll to top when clicked
              onBlur={() => {
                // Delay to allow clicks on suggestions
                setTimeout(() => {
                  setSearchFocused(false);
                  setShowSuggestions(false);
                }, 200);
              }}
              className={`w-full bg-gray-100 dark:bg-zinc-800 text-black dark:text-white placeholder-gray-500 rounded-full py-3 transition-all ${
                searchFocused
                  ? 'pl-12 pr-12 shadow-md border-green-500'
                  : 'pl-10 pr-4 shadow-sm border-transparent'
              }`}
              aria-autocomplete="list"
              aria-controls="suggestions-list"
              aria-expanded={showSuggestions}
            />

            {/* Search icon (shows when not focused) */}
            {!searchFocused && (
              <div className="absolute left-3 text-gray-500">
                <Search className="w-5 h-5" />
              </div>
            )}

            {/* Clear button */}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  onFilterChange(allDoctors);
                }}
                className="absolute right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Spotify-style dropdown panel */}
        {showSuggestions && (
          <div className="absolute z-20 w-full bg-white dark:bg-zinc-900 rounded-lg shadow-lg mt-1 overflow-hidden text-black dark:text-white border-gray-200 dark:border-zinc-700">
            {/* Recent searches section */}
            {recentSearches.length > 0 && !searchQuery && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">Recent searches</h3>
                </div>
                <ul>
                  {recentSearches.map((search, index) => (
                    <li
                      key={`recent-${index}`}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                      onClick={() => handleRecentSearchClick(search)}
                    >
                      <div className="flex items-center">
                        <div className="bg-gray-200 dark:bg-zinc-700 w-10 h-10 rounded-md flex items-center justify-center mr-3">
                          <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <span>{search}</span>
                      </div>
                      <button
                        onClick={(e) => clearRecentSearch(e, index)}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        aria-label="Remove from recent searches"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Search results */}
            {searchQuery && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400">
                    {filteredSuggestions.length > 0 ? '' : 'No results found'}
                  </h3>
                </div>
                <ul ref={suggestionsRef} id="suggestions-list" role="listbox">
                  {filteredSuggestions.map((doctor, index) => (
                    <li
                      key={doctor._id}
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
                      <div className="bg-gray-200 dark:bg-zinc-700 w-10 h-10 rounded-md overflow-hidden mr-3">
                        {doctor.photo?.asset?.url ? (
                          <img
                            src={doctor.photo.asset.url}
                            alt={`${doctor.name}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xl font-semibold text-gray-500">
                              {doctor.name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{doctor.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {doctor.specialty}
                          {doctor.averageRating && ` • ${doctor.averageRating}★`}
                        </div>
                      </div>
                    </li>
                  ))}

                  {searchQuery && filteredSuggestions.length === 0 && (
                    <li className="py-4 text-center text-gray-500 dark:text-gray-400">
                      No matching doctors found.
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          onFilterChange(allDoctors);
                        }}
                        className="block mt-2 text-green-500 hover:underline"
                      >
                        View all doctors
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}