'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchBox, useHits } from 'react-instantsearch';
import { debounce } from 'lodash';
import { Input } from '@/components/ui/input';
import { Search, X, ArrowLeft } from 'lucide-react';

interface Post {
  _id: string;
  title: string | null;
  slug: { current?: string } | null;
  excerpt: string | null;
  imageUrl?: string;
  imageAlt?: string;
  categoryIds?: string[];
  categoryTitles?: string[];
  doctorAuthor?: { name: string; specialty: string } | null;
}

export default function BlogSearchAlgolia() {
  const { query, refine } = useSearchBox();
  const { results } = useHits<Post>();
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showResetNotice, setShowResetNotice] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('recentBlogSearches');
    if (saved) setRecentSearches(JSON.parse(saved).slice(0, 4));
  }, []);

  const debouncedRefine = useRef(
    debounce((value: string) => {
      setIsSearching(true);
      refine(value);
      setIsSearching(false);
    }, 50)
  ).current;

  const saveToRecentSearches = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 4);
    setRecentSearches(updated);
    localStorage.setItem('recentBlogSearches', JSON.stringify(updated));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setShowSuggestions(!!value.trim());
    if (value === '') {
      refine('');
    } else {
      debouncedRefine(value);
    }
  };

  const handleSearchSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    refine(trimmed);
    saveToRecentSearches(trimmed);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      refine('');
      setShowSuggestions(false);
      searchInputRef.current?.blur();
    }
  };

  const handleRecentSearchClick = (term: string) => {
    refine(term);
    setShowSuggestions(true);
  };

  const clearRecentSearches = () => {
    localStorage.removeItem('recentBlogSearches');
    setRecentSearches([]);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
      if (query.trim() && !results?.hits.length) {
        refine('');
        setShowResetNotice(true);
        setTimeout(() => setShowResetNotice(false), 2500);
      }
    }, 200);
  };

  return (
    <div
      className={`relative w-full mx-auto transition-all duration-300 ease-in-out ${
        isFocused ? 'max-w-[34rem] scale-100' : 'max-w-lg scale-[0.98]'
      }`}
      role="search"
    >
      <div className="relative">
        <div className={`transition-all duration-200 ${isFocused ? 'my-1' : ''}`}>
          <div className="flex items-center relative bg-white rounded-full shadow-sm border border-gray-200 transition-all duration-200">
            {isFocused && (
              <button
                type="button"
                className="absolute left-3 text-zinc-400 hover:text-zinc-600 p-1"
                onClick={() => {
                  setIsFocused(false);
                  setShowSuggestions(false);
                  searchInputRef.current?.blur();
                }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Search blog posts"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setIsFocused(true);
                setShowSuggestions(!!query.trim() || recentSearches.length > 0);
              }}
              onClick={() => {
                setIsFocused(true);
                setShowSuggestions(!!query.trim() || recentSearches.length > 0);
              }}
              onBlur={handleBlur}
              aria-autocomplete="list"
              aria-controls="suggestions-list"
              aria-expanded={showSuggestions}
              className={`w-full text-zinc-800 placeholder-zinc-400 rounded-full transition-all duration-200 focus:ring-[var(--mid-shade)] shadow-2xl focus:ring-2 focus:border-[var(--mid-shade)] ${
                isFocused ? 'pl-12 pr-10 py-6' : 'pl-12 pr-4 py-5'
              } ${isSearching ? 'opacity-70' : ''}`}
            />

            {!isFocused && (
              <div className="absolute left-3 text-zinc-400">
                <Search className="w-5 h-5" />
              </div>
            )}

            {query.trim() && (
              <button
                type="button"
                onClick={() => {
                  refine('');
                  setShowSuggestions(false);
                }}
                className="absolute right-3 text-zinc-400 hover:text-zinc-600 p-1"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {showSuggestions && query.trim() && (
          <div className="w-full mt-2 rounded-xl border border-zinc-200 bg-white shadow-xl overflow-hidden animate-fade-slide-in">
            <ul
              id="suggestions-list"
              role="listbox"
              className="p-1 max-h-60 overflow-y-auto scroll-smooth"
            >
              {results?.hits.length === 0 ? (
                <li className="py-4 text-center text-sm text-zinc-500">No matching posts found.</li>
              ) : (
                (results?.hits as Post[]).slice(0, 5).map((post, idx) => (
                  <li
                    key={post._id ?? idx}
                    onClick={() => {
                      refine(post.title ?? '');
                      saveToRecentSearches(post.title ?? '');
                      setShowSuggestions(false);
                    }}
                    className="flex items-center px-3 py-2 rounded-md cursor-pointer text-sm hover:bg-zinc-100"
                    role="option"
                  >
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium truncate">{post.title ?? 'Untitled'}</span>
                      <span className="text-xs text-zinc-500 truncate">
                        {post.categoryTitles?.join(', ') || 'No categories'}
                      </span>
                      {post.doctorAuthor && (
                        <span className="text-xs text-zinc-500 truncate">
                          By {post.doctorAuthor.name} ({post.doctorAuthor.specialty})
                        </span>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}

        {isFocused && !query.trim() && recentSearches.length > 0 && (
          <div className="w-full mt-2 rounded-xl border border-zinc-200 bg-white shadow-xl overflow-hidden animate-fade-slide-in">
            <div className="flex items-center justify-between px-3 py-2 text-sm text-zinc-500 border-b border-zinc-200">
              <span>Recent Searches</span>
              <button
                onClick={clearRecentSearches}
                className="text-xs text-zinc-500 hover:text-zinc-700 transition"
              >
                Clear all
              </button>
            </div>
            <ul id="recent-searches-list" role="listbox" className="p-1 max-h-60 overflow-y-auto scroll-smooth">
              {recentSearches.map((term, idx) => (
                <li
                  key={`recent-${idx}`}
                  onClick={() => handleRecentSearchClick(term)}
                  className="px-3 py-2 text-sm text-zinc-700 rounded-md cursor-pointer hover:bg-zinc-100 transition-colors"
                  role="option"
                >
                  {term}
                </li>
              ))}
            </ul>
          </div>
        )}

        {showResetNotice && (
          <div className="mt-2 text-center text-sm text-zinc-400 italic animate-fade-slide-in">
            Search reset due to no matches.
          </div>
        )}
      </div>
    </div>
  );
}