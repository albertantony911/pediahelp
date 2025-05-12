'use client';

import { useEffect, useMemo, useState } from 'react';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, Configure, useHits, usePagination } from 'react-instantsearch';
import { client } from '@/sanity/lib/client';
import { BLOG_LANDING_QUERY } from '@/sanity/queries/blog-landing';
import BlogSearchAlgolia from './BlogSearchAlgolia';
import BlogCategoryFilter from './BlogCategoryFilter';
import PostCard from './PostCard';
import { Title } from '@/components/ui/theme/typography';
import { Button } from '@/components/ui/button';

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
  categoryTitles?: string[];
}

interface Category {
  _id: string;
  title: string;
}

export default function BlogLanding() {
  const [fallbackPosts, setFallbackPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const searchClient = useMemo(
    () =>
      algoliasearch(
        process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
        process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
      ),
    []
  );

  // Fetch initial posts and categories from Sanity
  useEffect(() => {
    client.fetch(BLOG_LANDING_QUERY).then((data) => {
      // Debug categories and posts
      console.log('Sanity Categories:', data.categories);
      console.log('Sanity Posts:', data.posts);

      // Map categoryIds to categoryTitles for fallback posts
      const enrichedPosts = (data.posts || []).map((post: Post) => {
        const categoryTitles = post.categoryIds
          ? post.categoryIds
              .map((id) => {
                const category = data.categories?.find((cat: Category) => cat._id === id);
                return category?.title;
              })
              .filter(Boolean) as string[]
          : [];
        
        console.log(`Post ${post._id}:`, { categoryIds: post.categoryIds, categoryTitles });

        return {
          ...post,
          categoryTitles,
        };
      });

      setFallbackPosts(enrichedPosts);
      setCategories(data.categories || []);
    });
  }, []);

  // Get Algolia hits and pagination info
  const { hits } = useHits<Post>();
  const { currentRefinement, nbPages, refine } = usePagination();

  // Debug Algolia hits
  useEffect(() => {
    console.log('Algolia Hits:', hits);
  }, [hits]);

  // Determine displayed posts (Algolia hits or fallback)
  const displayedPosts = hits.length > 0 ? hits : fallbackPosts;

  // Filter posts by selected category
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
        </div>

        {/* Pagination Controls */}
        {filteredByCategory.length > 0 && nbPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              variant="outline"
              disabled={currentRefinement === 0}
              onClick={() => refine(currentRefinement - 1)}
            >
              Previous
            </Button>
            <span className="text-gray-500">
              Page {currentRefinement + 1} of {nbPages}
            </span>
            <Button
              variant="outline"
              disabled={currentRefinement >= nbPages - 1}
              onClick={() => refine(currentRefinement + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </InstantSearch>
    </section>
  );
}