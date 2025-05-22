'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchBox, useInstantSearch } from 'react-instantsearch';
import { Input } from '@/components/ui/input';
import { Search, X, ArrowLeft } from 'lucide-react';
import type { Doctor } from '@/types';
import { debounce } from 'lodash';

interface Props {
  allDoctors: Doctor[];
  onFilterChange: (filteredHits: any[]) => void;
}

export default function DrawerDoctorSearch({ onFilterChange }: Props) {
  const { query, refine } = useSearchBox();
  const { results } = useInstantSearch();
  const [inputValue, setInputValue] = useState(query);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  const debouncedRefine = useRef(
    debounce((value: string) => {
      refine(value);
      setIsSearching(false);
    }, 300)
  ).current;

  useEffect(() => {
    if (results?.hits && Array.isArray(results.hits)) {
      onFilterChange(results.hits);
    }
  }, [results, onFilterChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(!!value.trim());
    setActiveSuggestion(-1);

    if (value.trim() === '') {
      refine('');
      setIsSearching(false);
    } else {
      setIsSearching(true);
      debouncedRefine(value);
    }
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
        setInputValue(hits[activeSuggestion].name);
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      refine('');
      setInputValue('');
      setShowSuggestions(false);
      searchRef.current?.blur();
    }
  };

  const handleClear = () => {
    refine('');
    setInputValue('');
    setShowSuggestions(false);
  };

  return (
    <div className="relative max-w-lg mx-auto w-full px-8   sm:px-0">
      <div className="relative">
        <div className={`transition-all duration-200 ${isFocused ? 'my-2' : ''}`}>
        <div
          className={`flex items-center relative rounded-full border transition-all z-10 ${
            isSearching
              ? 'ring-2 ring-[rgba(28,148,123,0.4)] border-[rgba(28,148,123,0.4)] shadow-[0_0_10px_rgba(28,148,123,0.5)]'
              : 'border-transparent '
          } bg-white`}
        >
            {isFocused && (
              <button
                className="absolute left-3 text-gray-400 hover:text-white p-1 "
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
              placeholder="Search by name or speciality"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
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
                }, 200);
              }}
              className={`w-full truncate bg-gray-100 dark:bg-zinc-800 text-black dark:text-white placeholder-gray-500 rounded-full py-5.5 sm:py-6 transition-all ${
                isFocused
                  ? inputValue.trim()
                    ? 'pl-12 pr-16 shadow-md truncate'
                    : 'pl-12 pr-12 shadow-md truncate'
                  : 'pl-12 pr-4  shadow-sm truncate'
              } ${isSearching ? 'opacity-70' : ''}`}
              aria-autocomplete="list"
              aria-controls="suggestions-list"
              aria-expanded={showSuggestions}
            />

            {!isFocused && (
              <div className="absolute left-3 text-gray-500">
                <Search className="w-5 h-5" />
              </div>
            )}

            {!isSearching && inputValue.trim() && (
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

        {showSuggestions && inputValue.trim() && (
          <div className="w-full bg-white dark:bg-zinc-900 rounded-lg shadow-md mt-2 text-black dark:text-white border border-gray-200 dark:border-zinc-700">
            <ul ref={suggestionsRef} id="suggestions-list" role="listbox" className="p-1">
              {(results?.hits as any[])?.length === 0 ? (
                <li className="py-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No matching doctors found.
                </li>
              ) : (
                (results?.hits as any[]).slice(0, 6).map((hit, index) => {
                  const isActive = activeSuggestion === index;
                  return (
                    <li
                      key={hit.objectID}
                      onClick={() => {
                        refine(hit.name);
                        setInputValue(hit.name);
                        setShowSuggestions(false);
                      }}
                      onMouseEnter={() => setActiveSuggestion(index)}
                      className={`p-2 rounded-md cursor-pointer flex items-center gap-3 ${
                        isActive
                          ? 'bg-gray-100 dark:bg-zinc-800'
                          : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                      }`}
                      role="option"
                      aria-selected={isActive}
                    >
                      <div className="w-[36px] aspect-[3/4] h-10 rounded-md bg-zinc-200 overflow-hidden shrink-0 border border-zinc-300 dark:border-zinc-700">
                        {hit.photoUrl ? (
                          <img
                            src={hit.photoUrl}
                            alt={hit.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                              {hit.name?.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col overflow-hidden text-sm">
                        <div className="truncate font-medium max-w-[160px]">{hit.name}</div>
                        {hit.specialty && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {hit.specialty}
                          </div>
                        )}
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