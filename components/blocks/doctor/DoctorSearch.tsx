'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchBox, useInstantSearch } from 'react-instantsearch';
import { Input } from '@/components/ui/input';
import { Search, X, ArrowLeft } from 'lucide-react';
import type { Doctor } from '@/types';

interface Props {
  allDoctors: Doctor[];
  onFilterChange: (filteredHits: any[]) => void;
}

export default function DrawerDoctorSearch({ onFilterChange }: Props) {
  const { query, refine } = useSearchBox();
  const { results } = useInstantSearch();
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);

  const searchRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (results?.hits && Array.isArray(results.hits)) {
      onFilterChange(results.hits);
    }
  }, [results, onFilterChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    refine(e.target.value);
    setShowSuggestions(!!e.target.value.trim());
    setActiveSuggestion(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const hits = results?.hits as any[] || [];
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.min(prev + 1, hits.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestion >= 0 && hits[activeSuggestion]) {
        refine(hits[activeSuggestion].name);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      refine('');
      setShowSuggestions(false);
      searchRef.current?.blur();
    }
  };

  const handleClear = () => {
    refine('');
    setShowSuggestions(false);
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
                onClick={handleClear}
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
              {(results?.hits as any[])?.length === 0 ? (
                <li className="py-4 text-center text-gray-500 dark:text-gray-400">
                  No matching doctors found.
                </li>
              ) : (
                (results?.hits as any[]).slice(0, 5).map((hit, index) => {
                  const isActive = activeSuggestion === index;
                  return (
                    <li
                      key={hit.objectID}
                      onClick={() => {
                        refine(hit.name);
                        setShowSuggestions(false);
                      }}
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
                        {hit.name}
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