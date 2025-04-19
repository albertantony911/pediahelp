'use client';

import React, {
  useState,
  useEffect,
  useRef,
  ChangeEvent,
  KeyboardEvent,
  useMemo,
} from 'react';
import { useSearchBox, useInstantSearch } from 'react-instantsearch';
import { debounce } from 'lodash';
import { Input } from '@/components/ui/input';
import { Search, X, ArrowLeft } from 'lucide-react';
import { PostWithDoctor } from '@/types';

type AlgoliaPost = PostWithDoctor & { objectID?: string; categoryTitles?: string[] };

interface BlogSearchAlgoliaProps {
  onFilterChange?: (filteredPosts: AlgoliaPost[]) => void;
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

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // ⛓ Debounced refine to reduce API calls
  const debouncedRefine = useMemo(
    () =>
      debounce((value: string) => {
        setIsSearching(true);
        refine(value);
      }, 120),
    [refine]
  );

  useEffect(() => {
    const saved = localStorage.getItem('recentBlogSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 4));
    }
  }, []);

  useEffect(() => {
    if (results) {
      const hits = results.hits as AlgoliaPost[];
      onFilterChange?.(hits);
      setIsSearching(false);
    }
  }, [results, onFilterChange]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setShowSuggestions(!!value.trim());
    setActiveSuggestion(-1);

    value.trim() ? debouncedRefine(value) : refine('');
  };

  const saveToRecentSearches = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 4);
    setRecentSearches(updated);
    localStorage.setItem('recentBlogSearches', JSON.stringify(updated));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const hits = (results?.hits as AlgoliaPost[]) ?? [];

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

  const handleSearchSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    refine(trimmed);
    saveToRecentSearches(trimmed);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (post: AlgoliaPost) => {
    refine(post.title);
    saveToRecentSearches(post.title);
    setShowSuggestions(false);
  };

  const handleRecentSearchClick = (term: string) => {
    refine(term);
    saveToRecentSearches(term);
    setShowSuggestions(true);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);

      const hits = (results?.hits as AlgoliaPost[]) ?? [];
      if (query.trim() && hits.length === 0) {
        refine('');
        setShowResetNotice(true);
        setTimeout(() => setShowResetNotice(false), 2500);
      }
    }, 150);
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
                setIsFocused(true);
                setShowSuggestions(!!query.trim() || recentSearches.length > 0);
              }}
              onClick={() => {
                setIsFocused(true);
                setShowSuggestions(!!query.trim() || recentSearches.length > 0);
              }}
              onBlur={handleBlur}
              aria-autocomplete="list"
              aria-expanded={showSuggestions}
              aria-controls="suggestions-list"
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

        {/* 🔍 Suggestions */}
        {showSuggestions && query.trim() && results && (
          <div className="absolute w-full z-10 bg-white dark:bg-zinc-900 rounded-lg shadow-md mt-3 border border-gray-200 dark:border-zinc-700">
            <ul id="suggestions-list" role="listbox" className="p-2">
              {(results.hits as AlgoliaPost[]).slice(0, 5).map((post, index) => {
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
                    <div className="truncate">
                      <div className="font-medium truncate max-w-[200px]">{post.title}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                        {post.categoryTitles?.join(', ') || 'No categories'}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* 🕘 Recent Searches */}
        {isFocused && !query.trim() && recentSearches.length > 0 && (
          <div className="absolute w-full z-10 bg-white dark:bg-zinc-900 rounded-lg shadow-md mt-3 border border-gray-200 dark:border-zinc-700">
            <ul role="listbox" className="p-2">
              {recentSearches.map((search, index) => (
                <li
                  key={`recent-${index}`}
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