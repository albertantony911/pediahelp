'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { debounce } from 'lodash';
import Fuse from 'fuse.js';
import { Input } from '@/components/ui/input';
import { Search, X, ArrowLeft } from 'lucide-react';
import { PostWithDoctor } from '@/types';

interface BlogSearchProps {
  allPosts: PostWithDoctor[];
  onFilterChange: (filteredPosts: PostWithDoctor[]) => void;
  initialSearchQuery?: string;
}

export default function BlogSearch({
  allPosts,
  onFilterChange,
  initialSearchQuery = '',
}: BlogSearchProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showResetNotice, setShowResetNotice] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  const fuse = useMemo(
    () =>
      new Fuse<PostWithDoctor>(allPosts, {
        keys: [
          'title',
          'categories.title',
          'doctor.name',
          'searchKeywords',
        ],
        threshold: 0.3,
      }),
    [allPosts]
  );

  useEffect(() => {
    const saved = localStorage.getItem('recentBlogSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 4));
    }
  }, []);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const saveToRecentSearches = (query: string) => {
    if (!query.trim()) return;
    setRecentSearches((prev) => {
      const updated = [query, ...prev.filter((s) => s !== query)].slice(0, 4);
      localStorage.setItem('recentBlogSearches', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSearch = useCallback(
    debounce((query: string) => {
      const trimmed = query.trim();
      if (!trimmed) {
        onFilterChange(allPosts);
        return;
      }

      const results = fuse.search(trimmed).map((r) => r.item);
      onFilterChange(results);
    }, 300),
    [allPosts, onFilterChange, fuse]
  );

  const filteredSuggestions = useMemo(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return [];
    return fuse.search(trimmed).map((r) => r.item).slice(0, 5);
  }, [searchQuery, fuse]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);
    setActiveSuggestion(-1);
    handleSearch(value);
  };

  const handleSearchSubmit = () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;

    const results = fuse.search(trimmed).map((r) => r.item);
    onFilterChange(results);
    saveToRecentSearches(trimmed);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.min(prev + 1, filteredSuggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestion >= 0) {
        handleSuggestionClick(filteredSuggestions[activeSuggestion]);
      } else {
        handleSearchSubmit();
      }
    } else if (e.key === 'Escape') {
      setSearchQuery('');
      onFilterChange(allPosts);
      setShowSuggestions(false);
      searchRef.current?.blur();
    }
  };

  const handleSuggestionClick = (post: PostWithDoctor) => {
    setSearchQuery(post.title);
    onFilterChange([post]);
    saveToRecentSearches(post.title);
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);

      if (searchQuery.trim() && filteredSuggestions.length === 0) {
        setSearchQuery('');
        onFilterChange(allPosts);
        setShowResetNotice(true);
        setTimeout(() => setShowResetNotice(false), 2500);
      }
    }, 200);
  };

  return (
    <div className="relative max-w-lg mx-auto px-4 sm:px-0 mb-6">
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
              placeholder="Search by title, category, or doctor"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                searchRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                window.scrollBy({ top: -100, behavior: 'smooth' });
                setIsFocused(true);
                setShowSuggestions(true);
              }}
              onClick={() => {
                setIsFocused(true);
                setShowSuggestions(true);
              }}
              onBlur={handleBlur}
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

            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  onFilterChange(allPosts);
                }}
                className="absolute right-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-2"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {showSuggestions && (searchQuery.trim() || filteredSuggestions.length > 0) && (
          <div className="w-full bg-white dark:bg-zinc-900 rounded-lg shadow-md mt-3 text-black dark:text-white border border-gray-200 dark:border-zinc-700">
            <ul
              ref={suggestionsRef}
              id="suggestions-list"
              role="listbox"
              className="p-2"
            >
              {searchQuery.trim() && filteredSuggestions.length === 0 ? (
                <li className="py-4 text-center text-gray-500 dark:text-gray-400">
                  No matching posts found.
                </li>
              ) : (
                filteredSuggestions.map((post, index) => {
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
                      <div className="bg-gray-200 dark:bg-zinc-700 w-[40px] aspect-[2/3] rounded-md overflow-hidden mr-3 shrink-0">
                        {post.mainImage?.asset?.url ? (
                          <img
                            src={post.mainImage.asset.url}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xl font-semibold text-gray-500">
                              {post.title.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="truncate">
                        <div className="font-medium truncate max-w-[200px]">
                          {post.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                          {post.categories?.map((cat) => cat.title).join(', ') || 'No categories'}
                        </div>
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