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

type AlgoliaPost = PostWithDoctor & { objectID?: string };

export default function BlogPageWrapper() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredPosts, setFilteredPosts] = useState<AlgoliaPost[]>([]);
  const [fallbackPosts, setFallbackPosts] = useState<AlgoliaPost[]>([]);

  // ✅ Fetch Sanity categories and fallback posts
  useEffect(() => {
    async function fetchFallback() {
      try {
        const fetchedCategories = await client.fetch(getAllCategoriesQuery);
        const fetchedPosts = await client.fetch(getAllPostsQuery);
        setCategories(fetchedCategories);
        setFallbackPosts(fetchedPosts);
        setFilteredPosts(fetchedPosts);
      } catch (error) {
        console.error('Error fetching blog data:', error);
      }
    }

    fetchFallback();
  }, []);

  // ✅ Check for duplicate keys (for safety/debugging)
  useEffect(() => {
    const posts = filteredPosts.length > 0 ? filteredPosts : fallbackPosts;
    const ids = posts.map((p) => p.objectID ?? p._id ?? p.slug?.current);
    const duplicates = ids.filter((id, i) => id && ids.indexOf(id) !== i);
    if (duplicates.length > 0) {
      console.warn('⚠️ Duplicate blog post keys detected:', duplicates);
    }
  }, [filteredPosts, fallbackPosts]);

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Our Blog</h1>

      <InstantSearch searchClient={searchClient} indexName="blog_posts_index">
        {/* 🔍 Algolia Config */}
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
          {(filteredPosts.length > 0 ? filteredPosts : fallbackPosts).map((post) => (
            <PostCard
              key={
                post.objectID ?? post._id ?? post.slug?.current ?? Math.random().toString()
              }
              post={post}
            />
          ))}
        </div>
      </InstantSearch>
    </section>
  );
}