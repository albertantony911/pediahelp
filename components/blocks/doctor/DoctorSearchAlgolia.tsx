'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchBox, useInstantSearch } from 'react-instantsearch';
import { debounce } from 'lodash';
import { Input } from '@/components/ui/input';
import { Search, X, ArrowLeft } from 'lucide-react';

interface Doctor {
  objectID: string;
  name: string;
  specialty?: string;
  photoUrl?: string;
}

interface Props {
  onFilterChange: (filtered: { objectID: string }[]) => void;
}

export default function DoctorSearchAlgolia({ onFilterChange }: Props) {
  const { query, refine } = useSearchBox();
  const { results } = useInstantSearch();

  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showResetNotice, setShowResetNotice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  // Load recent searches
  useEffect(() => {
    const stored = localStorage.getItem('recentDoctorSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored).slice(0, 4));
    }
  }, []);

  // Push latest results to parent on change
  useEffect(() => {
    if (results) {
      setIsLoading(false);
      const hits = results.hits as Doctor[];
      onFilterChange(hits.map(({ objectID }) => ({ objectID })));
    }
  }, [results, onFilterChange]);

  const debouncedRefine = useRef(
    debounce((value: string) => {
      setIsLoading(true);
      refine(value);
    }, 50)
  ).current;

  const updateRecentSearches = (term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;
    const updated = [cleaned, ...recentSearches.filter((s) => s !== cleaned)].slice(0, 4);
    setRecentSearches(updated);
    localStorage.setItem('recentDoctorSearches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    localStorage.removeItem('recentDoctorSearches');
    setRecentSearches([]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setShowSuggestions(!!value.trim());
    setActiveIndex(-1);
    value === '' ? refine('') : debouncedRefine(value);
  };

  const handleSearch = () => {
    const cleaned = query.trim();
    if (!cleaned) return;
    refine(cleaned);
    updateRecentSearches(cleaned);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const hits = (results?.hits as Doctor[]) || [];

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, hits.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && hits[activeIndex]) {
          selectSuggestion(hits[activeIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        refine('');
        setShowSuggestions(false);
        inputRef.current?.blur();
        break;
    }
  };

  const selectSuggestion = (doctor: Doctor) => {
    refine(doctor.name);
    updateRecentSearches(doctor.name);
    setShowSuggestions(false);
  };

  const selectRecentSearch = (term: string) => {
    refine(term);
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);

      const hasNoHits = results && (results.hits as Doctor[]).length === 0;
      if (query.trim() && hasNoHits) {
        refine('');
        setShowResetNotice(true);
        setTimeout(() => setShowResetNotice(false), 2500);
      }
    }, 200);
  };

  const renderSuggestionItem = (doctor: Doctor, index: number) => {
    const isActive = activeIndex === index;
    return (
      <li
        key={doctor.objectID}
        onClick={() => selectSuggestion(doctor)}
        onMouseEnter={() => setActiveIndex(index)}
        className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${
          isActive ? 'bg-zinc-100' : 'hover:bg-zinc-100'
        }`}
        role="option"
        aria-selected={isActive}
      >
        <div className="bg-zinc-200 w-[40px] aspect-[2/3] rounded-md overflow-hidden mr-3 shrink-0">
          {doctor.photoUrl ? (
            <img src={doctor.photoUrl} alt={doctor.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-xl font-semibold text-zinc-800">{doctor.name.charAt(0)}</span>
            </div>
          )}
        </div>
        <div className="truncate">
          <div className="font-medium truncate text-zinc-800 max-w-[200px]">{doctor.name}</div>
          <div className="text-sm text-zinc-500 truncate max-w-[200px]">
            {doctor.specialty || '—'}
          </div>
        </div>
      </li>
    );
  };

  return (
    <div className="relative max-w-lg mx-auto px-4 sm:px-0">
      <div className="relative">
        <div className={`transition-all duration-200 ${isFocused ? 'my-2' : ''}`}>
          <div className="flex items-center relative bg-white rounded-full border border-zinc-200 shadow-sm">
            {isFocused && (
              <button
                className="absolute left-3 text-zinc-400 hover:text-zinc-600 p-1"
                onClick={() => {
                  setIsFocused(false);
                  setShowSuggestions(false);
                  inputRef.current?.blur();
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <Input
              ref={inputRef}
              type="text"
              placeholder="Search by name, specialty, or condition"
              value={query || ''}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setIsFocused(true);
                setShowSuggestions(!!query?.trim() || recentSearches.length > 0);
              }}
              onClick={() => {
                setIsFocused(true);
                setShowSuggestions(!!query?.trim() || recentSearches.length > 0);
              }}
              onBlur={handleBlur}
              className={`w-full text-zinc-800 placeholder-zinc-400 rounded-full py-5 transition-all focus:ring-[var(--mid-shade)] focus:ring-2 focus:border-[var(--mid-shade)] ${
                isFocused ? 'pl-12 pr-12 shadow-md' : 'pl-12 pr-4 shadow-sm'
              } ${isLoading ? 'opacity-70' : ''}`}
              aria-autocomplete="list"
              aria-controls="suggestions-list"
              aria-expanded={showSuggestions}
            />

            {!isFocused && (
              <div className="absolute left-3 text-zinc-400">
                <Search className="w-5 h-5" />
              </div>
            )}

            {(query || '').trim() && (
              <button
                onClick={() => {
                  refine('');
                  setShowSuggestions(false);
                }}
                className="absolute right-3 text-zinc-400 hover:text-zinc-600 p-2"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (query || '').trim() && (
          <div className="w-full mt-3 rounded-xl border border-zinc-200 bg-white shadow-xl overflow-hidden animate-fade-slide-in">
            <ul ref={suggestionsRef} id="suggestions-list" role="listbox" className="p-2">
              {(results?.hits as Doctor[]).length === 0 ? (
                <li className="py-4 text-center text-sm text-zinc-800">No matching doctors found.</li>
              ) : (
                (results?.hits as Doctor[]).slice(0, 5).map(renderSuggestionItem)
              )}
            </ul>
          </div>
        )}

        {/* Recent Searches */}
        {isFocused && !query?.trim() && recentSearches.length > 0 && (
          <div className="w-full mt-3 rounded-xl border border-zinc-200 bg-white shadow-xl overflow-hidden animate-fade-slide-in">
            <div className="flex items-center justify-between px-3 py-2 text-sm text-zinc-500 border-b border-zinc-200">
              <span>Recent Searches</span>
              <button
                onClick={clearRecentSearches}
                className="text-xs text-zinc-500 hover:text-zinc-700 transition"
              >
                Clear all
              </button>
            </div>
            <ul ref={suggestionsRef} id="recent-searches-list" role="listbox" className="p-2">
              {recentSearches.map((term, i) => (
                <li
                  key={`recent-${i}`}
                  onClick={() => selectRecentSearch(term)}
                  className="px-3 py-2 text-sm text-zinc-700 rounded-md cursor-pointer hover:bg-zinc-100 transition-colors"
                  role="option"
                >
                  {term}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reset message */}
        {showResetNotice && (
          <div className="mt-2 text-center text-sm text-zinc-400 italic animate-fade-slide-in">
            Search reset due to no matches.
          </div>
        )}
      </div>
    </div>
  );
}
