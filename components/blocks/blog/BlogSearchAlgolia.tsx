'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchBox, useInfiniteHits } from 'react-instantsearch';
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
}

type AlgoliaPost = Post & { objectID?: string; categoryTitles?: string[] };

export default function BlogSearchAlgolia() {
  const { query, refine } = useSearchBox();
  const { hits } = useInfiniteHits<AlgoliaPost>();
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showResetNotice, setShowResetNotice] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const suggestionsRef = useRef<HTMLUListElement | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentBlogSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 4));
    }
  }, []);

  // Debounced refine with 50ms delay
  const debouncedRefine = useRef(
    debounce((value: string) => {
      setIsSearching(true);
      refine(value);
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
        if (activeSuggestion >= 0 && hits[activeSuggestion]) {
          handleSuggestionClick(hits[activeSuggestion]);
        } else {
          handleSearchSubmit();
        }
        break;
      case 'Escape':
        refine('');
        setShowSuggestions(false);
        searchInputRef.current?.blur();
        break;
    }
  };

  const handleSuggestionClick = (post: AlgoliaPost) => {
    refine(post.title ?? '');
    saveToRecentSearches(post.title ?? '');
    setShowSuggestions(false);
  };

  const handleRecentSearchClick = (term: string) => {
    refine(term);
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);

      if (query.trim() && hits.length === 0) {
        refine('');
        setShowResetNotice(true);
        setTimeout(() => setShowResetNotice(false), 2500);
      }
    }, 200);
  };

  return (
    <div className="relative max-w-lg mx-auto px-4 sm:px-0" role="search">
      <div className="relative">
        <div className={`transition-all duration-200 ${isFocused ? 'my-2' : ''}`}>
          <div className="flex items-center relative bg-white dark:bg-zinc-900 rounded-full">
            {isFocused && (
              <button
                type="button"
                className="absolute left-3 text-gray-400 hover:text-white p-1"
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
                searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.scrollBy({ top: -100, behavior: 'smooth' });
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
              className={`w-full bg-gray-100 dark:bg-zinc-800 text-black dark:text-white placeholder-gray-500 rounded-full py-5 transition-all ${
                isFocused ? 'pl-12 pr-12 shadow-md border-green-500' : 'pl-12 pr-4 shadow-sm border-transparent'
              } ${isSearching ? 'opacity-70' : ''}`}
            />

            {!isFocused && (
              <div className="absolute left-3 text-gray-500">
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
                className="absolute right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Suggestions */}
        {showSuggestions && query.trim() && (
          <div className="absolute w-full z-10 bg-white dark:bg-zinc-900 rounded-lg shadow-md mt-3 border border-gray-200 dark:border-zinc-700">
            <ul id="suggestions-list" role="listbox" className="p-2" ref={suggestionsRef}>
              {hits.length === 0 ? (
                <li className="py-4 text-center text-gray-500 dark:text-gray-400">
                  No matching posts found.
                </li>
              ) : (
                hits.slice(0, 5).map((post, index) => {
                  const isActive = activeSuggestion === index;
                  return (
                    <li
                      key={post.objectID ?? post._id ?? index}
                      onClick={() => handleSuggestionClick(post)}
                      onMouseEnter={() => setActiveSuggestion(index)}
                      className={`flex items-center p-2 rounded-md cursor-pointer ${
                        isActive ? 'bg-gray-100 dark:bg-zinc-800' : 'hover:bg-gray-100 dark:hover:bg-zinc-800'
                      }`}
                      role="option"
                      aria-selected={isActive}
                    >
                      {post.imageUrl && (
                        <div className="bg-gray-200 dark:bg-zinc-700 w-[48px] aspect-[16/9] rounded-md overflow-hidden mr-3 shrink-0">
                          <img
                            src={post.imageUrl}
                            alt={post.imageAlt ?? post.title ?? 'Blog Post Image'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/fallback-image.jpg';
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 truncate">
                        <div className="font-medium truncate">{post.title ?? 'Untitled'}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {post.categoryTitles?.join(', ') || 'No categories'}
                        </div>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}

        {/* Recent Searches */}
        {isFocused && !query.trim() && recentSearches.length > 0 && (
          <div className="absolute w-full z-10 bg-white dark:bg-zinc-900 rounded-lg shadow-md mt-3 border border-gray-200 dark:border-zinc-700">
            <ul id="recent-searches-list" role="listbox" className="p-2">
              {recentSearches.map((search, index) => (
                <li
                  key={`recent-${index}`}
                  onClick={() => handleRecentSearchClick(search)}
                  className="p-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800"
                  role="option"
                >
                  <div className="truncate">{search}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Reset Notice */}
        {showResetNotice && (
          <div className="mt-2 text-center text-sm text-gray-500 dark:text_gray-400">
            Search reset due to no matches.
          </div>
        )}
      </div>
    </div>
  );
}