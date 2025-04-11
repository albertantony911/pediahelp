// components/SearchBar.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { debounce } from "lodash";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import { Doctor } from '@/types';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  filteredDoctors: Doctor[];
  setFilteredDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
  handleSearchSubmit: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  setSearchQuery,
  filteredDoctors,
  setFilteredDoctors,
  handleSearchSubmit,
  handleKeyDown,
}) => {
  const searchRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleSearch(query); // Call the debounce function
  };

  // Debounced search handler
  const handleSearch = debounce((query: string) => {
    const filtered = filteredDoctors.filter((doctor) =>
      doctor.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredDoctors(filtered);
  }, 300);

  return (
    <div className="relative flex-1 w-full">
      <Input
        ref={searchRef}
        type="text"
        placeholder="Search by doctor's name"
        value={searchQuery}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="w-full bg-white text-teal-900 placeholder-teal-400 rounded-full px-4 py-2 pr-10"
        aria-autocomplete="list"
        aria-controls="suggestions-list"
        aria-expanded={searchQuery.length > 0}
      />
      {searchQuery && (
        <button
          onClick={() => {
            setSearchQuery("");
            setFilteredDoctors([]);
            searchRef.current?.focus();
          }}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-teal-900"
          aria-label="Clear search"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      {/* Search Button */}
      <Button
        onClick={handleSearchSubmit}
        disabled={!searchQuery.trim()}
        className="bg-green-500 text-white rounded-full px-4 py-2 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        aria-label="Submit search"
      >
        <Search className="w-5 h-5" />
      </Button>
    </div>
  );
};

export default SearchBar;