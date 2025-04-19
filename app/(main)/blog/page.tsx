'use client';

import { useState, useEffect } from 'react';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, Configure } from 'react-instantsearch';

import BlogCategoryFilter from '@/components/blocks/blog/BlogCategoryFilter';
import BlogSearchAlgolia from '@/components/blocks/blog/BlogSearchAlgolia';
import PostCard from '@/components/blocks/blog/PostCard';

import { PostWithDoctor, Category } from '@/types';
import { client } from '@/sanity/lib/client';
import { getAllCategoriesQuery } from '@/lib/queries/blog/getAllCategories';
import { getAllPostsQuery } from '@/lib/queries/blog/getAllPosts';

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
);

export default function BlogPageWrapper() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredPosts, setFilteredPosts] = useState<PostWithDoctor[]>([]);
  const [fallbackPosts, setFallbackPosts] = useState<PostWithDoctor[]>([]);

  useEffect(() => {
    async function fetchFallback() {
      const fetchedCategories = await client.fetch(getAllCategoriesQuery);
      const fetchedPosts = await client.fetch(getAllPostsQuery);
      setCategories(fetchedCategories);
      setFallbackPosts(fetchedPosts);
      setFilteredPosts(fetchedPosts);
    }
    fetchFallback();
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Our Blog</h1>

      <InstantSearch searchClient={searchClient} indexName="blog_posts_index">
        <Configure
          filters={selectedCategory ? `categoryIds:${selectedCategory}` : ''}
          hitsPerPage={12}
        />

        {/* 🔍 Search */}
        <BlogSearchAlgolia onFilterChange={setFilteredPosts} />

        {/* 🏷️ Category Filter */}
        <BlogCategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={setSelectedCategory}
          onReset={() => setSelectedCategory(null)}
        />

        {/* 📝 Blog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredPosts.length > 0
            ? filteredPosts.map((post) => <PostCard key={post._id} post={post} />)
            : fallbackPosts.map((post) => <PostCard key={post._id} post={post} />)}
        </div>
      </InstantSearch>
    </section>
  );
}