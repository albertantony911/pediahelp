'use client';

import { useState, useEffect, useMemo } from 'react';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, Configure } from 'react-instantsearch';

import BlogCategoryFilter from './BlogCategoryFilter';
import BlogSearchAlgolia from './BlogSearchAlgolia';
import PostCard from './PostCard';

import type { PostWithDoctor, Category } from '@/types';

type AlgoliaPost = PostWithDoctor & { objectID?: string };

interface BlogPageProps {
  fallbackPosts: AlgoliaPost[];
  categories: Category[];
}

export default function BlogPage({ fallbackPosts, categories }: BlogPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredPosts, setFilteredPosts] = useState<AlgoliaPost[]>([]);

  const searchClient = useMemo(
    () =>
      algoliasearch(
        process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
        process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
      ),
    []
  );

  const displayedPosts = filteredPosts.length > 0 ? filteredPosts : fallbackPosts;

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const ids = displayedPosts.map((p) => p.objectID ?? p._id ?? p.slug?.current);
      const duplicates = ids.filter((id, i) => id && ids.indexOf(id) !== i);
      if (duplicates.length > 0) {
        console.warn('⚠️ Duplicate blog post keys detected:', duplicates);
      }
    }
  }, [displayedPosts]);

  return (
    <section className="max-w-6xl mx-auto px-4 py-12 bg-dark-shade">

      <InstantSearch
        searchClient={searchClient}
        indexName="blog_posts_index"
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Configure
          filters={selectedCategory ? `categoryIds:${selectedCategory}` : ''}
          hitsPerPage={12}
        />

        <BlogSearchAlgolia onFilterChange={setFilteredPosts} />

        <BlogCategoryFilter />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {displayedPosts.map((post) => {
            const key = post.objectID ?? post._id ?? post.slug?.current;
            return key ? <PostCard key={key} post={post} /> : null;
          })}
        </div>
      </InstantSearch>
    </section>
  );
}