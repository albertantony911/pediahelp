'use client';

import { useState } from 'react';
import { PostWithDoctor } from '@/types';
import { Search, X } from 'lucide-react';

interface BlogSearchProps {
  allPosts: PostWithDoctor[];
  onFilterChange: (filteredPosts: PostWithDoctor[]) => void;
}

export default function BlogSearch({ allPosts, onFilterChange }: BlogSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = allPosts.filter((post) =>
      post.title.toLowerCase().includes(query.toLowerCase())
    );
    onFilterChange(filtered);
  };

  const clearSearch = () => {
    setSearchQuery('');
    onFilterChange(allPosts); // Reset to all posts
  };

  return (
    <div className="max-w-lg mx-auto mb-6 relative">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search blog posts"
        className="w-full px-4 py-2 rounded-full border border-gray-300"
      />
      {searchQuery && (
        <button
          onClick={clearSearch}
          className="absolute right-3 top-3 text-gray-400"
        >
          <X size={20} />
        </button>
      )}
      <Search className="absolute left-3 top-3 text-gray-400" size={20} />
    </div>
  );
}