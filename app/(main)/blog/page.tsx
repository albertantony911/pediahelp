'use client';

import algoliasearch from 'algoliasearch/lite';
import { useState, useEffect } from 'react';
import {
  InstantSearch,
  SearchBox,
  Hits,
  Configure,
} from 'react-instantsearch';

import BlogCategoryFilter from '@/components/blocks/blog/BlogCategoryFilter';
import BlogSearch from '@/components/blocks/blog/BlogSearch';
import PostCard from '@/components/blocks/blog/PostCard';
import { PostWithDoctor, Category } from '@/types';
import { getAllCategoriesQuery } from '@/lib/queries/blog/getAllCategories';
import { getAllPostsQuery } from '@/lib/queries/blog/getAllPosts';
import { client } from '@/sanity/lib/client';

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
);

export default function BlogPageWrapper() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [posts, setPosts] = useState<PostWithDoctor[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<PostWithDoctor[]>([]);

  // Fetch categories and posts on mount
  useEffect(() => {
    async function fetchData() {
      const fetchedCategories = await client.fetch(getAllCategoriesQuery);
      const fetchedPosts = await client.fetch(getAllPostsQuery);
      setCategories(fetchedCategories);
      setPosts(fetchedPosts);
      setFilteredPosts(fetchedPosts);
    }
    fetchData();
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Our Blog</h1>

      {/* 🔍 Blog Search */}
      <BlogSearch allPosts={posts} onFilterChange={setFilteredPosts} />

      {/* 🏷️ Category Filter */}
      <BlogCategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
        onReset={() => setSelectedCategory(null)}
      />

      {/* 🧠 Send filter to Algolia */}
      <InstantSearch searchClient={searchClient} indexName="blog_posts_index">
        <Configure
          filters={selectedCategory ? `categoryIds:${selectedCategory}` : ''}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <Hits hitComponent={AlgoliaPostCardWrapper} />
        </div>
      </InstantSearch>

      {/* 🧩 Fallback to filtered posts if Algolia fails */}
      {filteredPosts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredPosts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}

// Custom wrapper to map Algolia hit to PostCard props
function AlgoliaPostCardWrapper({ hit }: { hit: PostWithDoctor }) {
  return <PostCard post={hit} />;
}