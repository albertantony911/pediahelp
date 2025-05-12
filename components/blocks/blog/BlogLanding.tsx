'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, Configure, useInfiniteHits } from 'react-instantsearch';
import { client } from '@/sanity/lib/client';
import { BLOG_LANDING_QUERY } from '@/sanity/queries/blog-landing';
import BlogSearchAlgolia from './BlogSearchAlgolia';
import BlogCategoryFilter from './BlogCategoryFilter';
import PostCard from './PostCard';
import PostCardSkeleton from './PostCardSkeleton';
import { Title } from '@/components/ui/theme/typography';

interface Post {
  _id: string;
  title: string | null;
  slug: { current?: string } | null;
  excerpt: string | null;
  image?: {
    asset?: { url?: string };
    alt?: string | null;
  } | null;
  imageUrl?: string;
  imageAlt?: string;
  categoryIds?: string[];
}

interface Category {
  _id: string;
  title: string;
}

export default function BlogLanding() {
  const [fallbackPosts, setFallbackPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const observerRef = useRef<HTMLDivElement | null>(null);

  const searchClient = useMemo(
    () =>
      algoliasearch(
        process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
        process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
      ),
    []
  );

  useEffect(() => {
    client.fetch(BLOG_LANDING_QUERY).then((data) => {
      setFallbackPosts(data.posts || []);
      setCategories(data.categories || []);
    });
  }, []);

  const { hits, isLastPage, showMore, results } = useInfiniteHits<Post>();

  useEffect(() => {
    if (results && hits.length > 0) {
      setFilteredPosts(hits);
    } else {
      setFilteredPosts([]);
    }
  }, [hits, results]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLastPage) {
          showMore();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [isLastPage, showMore]);

  const displayedPosts = filteredPosts.length > 0 ? filteredPosts : fallbackPosts;

  const filteredByCategory =
    selectedCategory === 'all'
      ? displayedPosts
      : displayedPosts.filter((post) => post.categoryIds?.includes(selectedCategory));

  return (
    <section className="max-w-6xl mx-auto px-4 py-12 bg-dark-shade">
      <Title className="mb-6 text-center">Latest from the Blog</Title>

      <InstantSearch
        searchClient={searchClient}
        indexName="blog_posts_index"
        future={{ preserveSharedStateOnUnmount: true }}
      >
        <Configure hitsPerPage={12} />

        <BlogSearchAlgolia />

        <BlogCategoryFilter
          categories={[{ _id: 'all', title: 'All' }, ...categories]}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredByCategory.length > 0 ? (
            filteredByCategory.map((post) => <PostCard key={post._id} post={post} />)
          ) : (
            <p className="text-center text-gray-500 col-span-full">No posts found.</p>
          )}

          {!isLastPage && filteredByCategory.length > 0 && (
            <>
              <PostCardSkeleton />
              <PostCardSkeleton />
              <PostCardSkeleton />
            </>
          )}
        </div>

        <div ref={observerRef} className="h-10" />

        {isLastPage && filteredByCategory.length > 0 && (
          <p className="text-center text-gray-500 mt-6">No more posts to load.</p>
        )}
      </InstantSearch>
    </section>
  );
}