'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchBox, useInstantSearch } from 'react-instantsearch';
import { debounce } from 'lodash';
import { Input } from '@/components/ui/input';
import { Search, X, ArrowLeft } from 'lucide-react';
import { PostWithDoctor } from '@/types';

interface BlogSearchAlgoliaProps {
  onFilterChange?: (filteredPosts: PostWithDoctor[]) => void;
}

export default function BlogSearchAlgolia({ onFilterChange }: BlogSearchAlgoliaProps) {
  const { query, refine } = useSearchBox();
  const { results } = useInstantSearch();
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showResetNotice, setShowResetNotice] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('recentBlogSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 4));
    }
  }, []);

  useEffect(() => {
    if (results) {
      setIsSearching(false);
      const hits = results.hits as PostWithDoctor[];
      if (onFilterChange) {
        onFilterChange(hits);
      }
    }
  }, [results, onFilterChange]);

  const debouncedRefine = useRef(
    debounce((value: string) => {
      setIsSearching(true);
      refine(value);
    }, 50)
  ).current;

  const saveToRecentSearches = (query: string) => {
    if (!query.trim()) return;
    setRecentSearches((prev) => {
      const updated = [query, ...prev.filter((s) => s !== query)].slice(0, 4);
      localStorage.setItem('recentBlogSearches', JSON.stringify(updated));
      return updated;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setShowSuggestions(!!value.trim());
    setActiveSuggestion(-1);

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
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.min(prev + 1, (results?.hits as PostWithDoctor[])?.length - 1 || 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const hits = results?.hits as PostWithDoctor[];
      if (activeSuggestion >= 0 && hits && hits[activeSuggestion]) {
        handleSuggestionClick(hits[activeSuggestion]);
      } else {
        handleSearchSubmit();
      }
    } else if (e.key === 'Escape') {
      refine('');
      setShowSuggestions(false);
      searchRef.current?.blur();
    }
  };

  const handleSuggestionClick = (post: PostWithDoctor) => {
    refine(post.title);
    saveToRecentSearches(post.title);
    setShowSuggestions(false);
  };

  const handleRecentSearchClick = (search: string) => {
    refine(search);
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);

      if (query.trim() && (!results || (results.hits as PostWithDoctor[])?.length === 0)) {
        refine('');
        setShowResetNotice(true);
        setTimeout(() => setShowResetNotice(false), 2500);
      }
    }, 200);
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
              placeholder="Search blog posts"
              value={query || ''}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.scrollBy({ top: -100, behavior: 'smooth' });
                setIsFocused(true);
                setShowSuggestions(!!query?.trim() || recentSearches.length > 0);
              }}
              onClick={() => {
                setIsFocused(true);
                setShowSuggestions(!!query?.trim() || recentSearches.length > 0);
              }}
              onBlur={handleBlur}
              className={`w-full bg-gray-100 dark:bg-zinc-800 text-black dark:text-white placeholder-gray-500 rounded-full py-5 transition-all ${
                isFocused
                  ? 'pl-12 pr-12 shadow-md border-green-500'
                  : 'pl-12 pr-4 shadow-sm border-transparent'
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

            {(query || '').trim() && (
              <button
                onClick={() => {
                  refine('');
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

        {showSuggestions && (query || '').trim() && (
          <div className="w-full bg-white dark:bg-zinc-900 rounded-lg shadow-md mt-3 text-black dark:text-white border border-gray-200 dark:border-zinc-700">
            <ul
              ref={suggestionsRef}
              id="suggestions-list"
              role="listbox"
              className="p-2"
            >
              {results && (results.hits as PostWithDoctor[])?.length === 0 ? (
                <li className="py-4 text-center text-gray-500 dark:text-gray-400">
                  No matching blog posts found.
                </li>
              ) : results ? (
                (results.hits as PostWithDoctor[])
                  .slice(0, 5)
                  .map((post, index) => {
                    const isActive = activeSuggestion === index;
                    return (
                      <li
                        key={post._id}
                        onClick={() => handleSuggestionClick(post)}
                        onMouseEnter={() => setActiveSuggestion(index)}
                        className={`flex items-center p-2 rounded-md cursor-pointer ${
                          isActive
                            ? 'bg-gray-100 dark:bg-zinc-800'
                            : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                        }`}
                        role="option"
                        aria-selected={isActive}
                      >
                        <div className="truncate">
                          <div className="font-medium truncate max-w-[200px]">
                            {post.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {post.categories?.map((c) => c.title).join(', ') || 'No categories'}
                          </div>
                        </div>
                      </li>
                    );
                  })
              ) : null}
            </ul>
          </div>
        )}

        {isFocused && !query?.trim() && recentSearches.length > 0 && (
          <div className="w-full bg-white dark:bg-zinc-900 rounded-lg shadow-md mt-3 text-black dark:text-white border border-gray-200 dark:border-zinc-700">
            <ul
              ref={suggestionsRef}
              id="recent-searches-list"
              role="listbox"
              className="p-2"
            >
              {recentSearches.map((search, index) => (
                <li
                  key={index}
                  onClick={() => handleRecentSearchClick(search)}
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
            Search reset due to no matches.
          </div>
        )}
      </div>
    </div>
  );
}