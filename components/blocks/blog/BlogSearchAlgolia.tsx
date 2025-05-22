'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchBox, useHits } from 'react-instantsearch';
import { debounce } from 'lodash';
import { Input } from '@/components/ui/input';
import { Search, X, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  _highlightResult?: {
    title?: { value: string };
    doctorAuthor?: {
      name?: { value: string };
      specialty?: { value: string };
    };
  };
}

export default function BlogSearchAlgolia() {
  const { refine } = useSearchBox();
  const { results } = useHits<Post>();

  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showResetNotice, setShowResetNotice] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('recentBlogSearches');
    if (saved) setRecentSearches(JSON.parse(saved).slice(0, 4));
  }, []);

  const debouncedRefine = useRef(
    debounce((value: string) => {
      refine(value);
      setIsSearching(false);
    }, 300)
  ).current;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setShowSuggestions(!!value.trim());

    if (value.trim() === '') {
      setIsSearching(false);
      refine('');
      return;
    }

    setIsSearching(true);
    debouncedRefine(value);
  };

  const handleSearchSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    refine(trimmed);
    saveToRecentSearches(trimmed);
    setShowSuggestions(false);
    scrollToResults();
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

  const saveToRecentSearches = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 4);
    setRecentSearches(updated);
    localStorage.setItem('recentBlogSearches', JSON.stringify(updated));
  };

  const handleRecentSearchClick = (term: string) => {
    refine(term);
    setInputValue(term);
    saveToRecentSearches(term);
    setShowSuggestions(true);
    scrollToResults();
  };

  const clearRecentSearches = () => {
    localStorage.removeItem('recentBlogSearches');
    setRecentSearches([]);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
      if (inputValue.trim() && !results?.hits.length) {
        refine('');
        setShowResetNotice(true);
        setTimeout(() => setShowResetNotice(false), 2500);
      }
    }, 200);
  };

  const scrollToResults = () => {
    if (window.innerWidth < 768 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderHighlightedText = (html?: string | null) =>
    html ? <span dangerouslySetInnerHTML={{ __html: html }} /> : null;

  return (
    <div
      className={`relative w-full mx-auto transition-all duration-300 ease-in-out ${
        isFocused ? 'max-w-[34rem] scale-100' : 'max-w-lg scale-[0.98]'
      }`}
      role="search"
    >
      <div className="relative">
        <div className={`transition-all duration-200 ${isFocused ? 'my-1' : ''}`}>
          <div
            className={`flex items-center relative bg-white rounded-full border border-gray-200 shadow-sm transition-all duration-300 ${
              isSearching ? 'animate-glow border-[var(--mid-shade)] ring-2 ring-[var(--mid-shade)]' : ''
            }`}
          >
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
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setIsFocused(true);
                setShowSuggestions(!!inputValue.trim() || recentSearches.length > 0);
              }}
              onClick={() => {
                setIsFocused(true);
                setShowSuggestions(!!inputValue.trim() || recentSearches.length > 0);
              }}
              onBlur={handleBlur}
              className={`w-full truncate text-zinc-800 placeholder-zinc-400 rounded-full transition-all duration-200 focus:ring-[var(--mid-shade)] shadow-2xl focus:ring-2 focus:border-[var(--mid-shade)] ${
                isFocused
                  ? inputValue.trim()
                    ? 'pl-12 pr-16 py-6'
                    : 'pl-12 pr-12 py-6'
                  : 'pl-10 pr-10 py-5'
              } ${isSearching ? 'opacity-70' : ''}`}
            />

            {!isFocused && (
              <div className="absolute left-3 text-zinc-400">
                <Search className="w-5 h-5" />
              </div>
            )}

            {isSearching && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 animate-spin">
                <Loader2 className="w-5 h-5" />
              </div>
            )}

            {!isSearching && inputValue.trim() && (
              <button
                type="button"
                onClick={() => {
                  refine('');
                  setInputValue('');
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-1"
                aria-label="Clear search"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {showSuggestions && (
          <div className="w-full mt-2 rounded-xl border border-zinc-200 bg-white shadow-xl overflow-hidden">
            <ul
              id="suggestions-list"
              role="listbox"
              className="p-1 max-h-60 overflow-y-auto scroll-smooth"
            >
              <AnimatePresence mode="popLayout">
                {inputValue.trim() && results?.hits.length === 0 ? (
                  <motion.li
                    key="no-results"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="py-4 text-center text-sm text-zinc-500 truncate"
                  >
                    No matching posts found.
                  </motion.li>
                ) : (
                  results?.hits.slice(0, 5).map((post, idx) => (
                    <motion.li
                      key={post._id ?? idx}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => {
                        refine(post.title ?? '');
                        setInputValue(post.title ?? '');
                        saveToRecentSearches(post.title ?? '');
                        setShowSuggestions(false);
                        scrollToResults();
                      }}
                      className="flex items-center px-3 py-2 rounded-md cursor-pointer text-sm hover:bg-zinc-100 truncate"
                      role="option"
                    >
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-medium truncate">
                          {renderHighlightedText(post._highlightResult?.title?.value) ??
                            post.title ?? 'Untitled'}
                        </span>
                        <span className="text-xs text-zinc-500 truncate">
                          {post.categoryTitles?.join(', ') || 'No categories'}
                        </span>
                        {post.doctorAuthor && (
                          <span className="text-xs text-zinc-500 truncate">
                            By{' '}
                            {renderHighlightedText(
                              post._highlightResult?.doctorAuthor?.name?.value
                            ) || post.doctorAuthor.name}
                            {post.doctorAuthor.specialty &&
                              ` (${renderHighlightedText(
                                post._highlightResult?.doctorAuthor?.specialty?.value
                              ) || post.doctorAuthor.specialty})`}
                          </span>
                        )}
                      </div>
                    </motion.li>
                  ))
                )}
              </AnimatePresence>
            </ul>
          </div>
        )}

        {isFocused && !inputValue.trim() && recentSearches.length > 0 && (
          <div className="w-full mt-2 rounded-xl border border-zinc-200 bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 text-sm text-zinc-500 border-b border-zinc-200">
              <span>Recent Searches</span>
              <button
                onClick={clearRecentSearches}
                className="text-xs text-zinc-500 hover:text-zinc-700"
              >
                Clear all
              </button>
            </div>
            <ul id="recent-searches-list" role="listbox" className="p-1 max-h-60 overflow-y-auto scroll-smooth">
              {recentSearches.map((term, idx) => (
                <li
                  key={`recent-${idx}`}
                  onClick={() => handleRecentSearchClick(term)}
                  className="px-3 py-2 text-sm text-zinc-700 rounded-md cursor-pointer hover:bg-zinc-100"
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

      <div ref={resultsRef} className="mt-8" />
    </div>
  );
}