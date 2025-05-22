'use client';

import { useEffect, useMemo, useState } from 'react';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, Configure, useHits, usePagination } from 'react-instantsearch';
import { motion, AnimatePresence } from 'framer-motion';
import { client } from '@/sanity/lib/client';
import { BLOG_LANDING_QUERY } from '@/sanity/queries/blog-landing';
import BlogSearchAlgolia from './BlogSearchAlgolia';
import BlogCategoryFilter from './BlogCategoryFilter';
import PostCard from './PostCard';
import { Title, Subtitle, Content } from '@/components/ui/theme/typography';
import { Theme, ThemeVariant } from '@/components/ui/theme/Theme';
import Logo from '@/components/logo';

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
  doctorAuthor?: { name: string; specialty: string } | null;
}

interface Category {
  _id: string;
  title: string;
}

interface BlogLandingProps {
  theme?: ThemeVariant | null;
}

export default function BlogLanding({ theme = 'dark-shade' }: BlogLandingProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const POSTS_PER_PAGE = 12;

  const searchClient = useMemo(
    () =>
      algoliasearch(
        process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
        process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
      ),
    []
  );

  useEffect(() => {
    client
      .fetch(BLOG_LANDING_QUERY)
      .then((data) => {
        console.log('Sanity Categories:', data.categories);
        setCategories(data.categories || []);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching Sanity categories:', error);
        setIsLoading(false);
      });
  }, []);

  const { hits, results } = useHits<Post>();
  const { currentRefinement: currentPage, nbPages, refine: setPage } = usePagination();

  useEffect(() => {
    console.log('Debug - Algolia Hits:', hits.length, hits.map((hit: Post) => hit._id));
    console.log('Debug - Algolia Results:', {
      nbHits: results?.nbHits,
      nbPages: results?.nbPages,
      query: results?.query,
    });
    console.log('Debug - Pagination - currentPage:', currentPage);
    console.log('Debug - Pagination - nbPages:', nbPages);
    console.log('Debug - selectedCategory:', selectedCategory);
  }, [hits, results, currentPage, nbPages, selectedCategory]);

  const handlePageChange = (page: number) => {
    setPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Theme variant={theme || 'dark-shade'}>
      <div className="w-full">
        <div className="lg:hidden w-full flex justify-center items-center">
          <Logo />
        </div>
        <section className="mx-auto py-12 lg:pt-48">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Subtitle>Find Expert-Written Resources</Subtitle>
            <Title>Knowledge Hub</Title>
            <Content>
              We believe every child has a unique spark. At our center, kids explore, learn, and laugh
              together in a safe, nurturing environment designed to spark curiosity and inspire
              creativity every single day.
            </Content>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-600">Loading posts...</div>
          ) : (
            <InstantSearch
              searchClient={searchClient}
              indexName="blog_posts_index"
              future={{ preserveSharedStateOnUnmount: true }}
            >
              <Configure
                hitsPerPage={POSTS_PER_PAGE}
                filters={selectedCategory ? `categoryIds:${selectedCategory}` : undefined}
              />

              <BlogSearchAlgolia />

              <BlogCategoryFilter
                categories={[{ _id: 'all', title: 'All' }, ...categories]}
                selected={selectedCategory || 'all'}
                onSelect={(category: string) => {
                  setSelectedCategory(category === 'all' ? null : category);
                  setPage(0);
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-12 lg:mt-16 max-w-6xl mx-auto">
                <AnimatePresence mode="wait">
                  {hits.length > 0 ? (
                    hits.map((post, index) => (
                      <motion.div
                        key={post._id || `post-${index}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <PostCard post={post} />
                      </motion.div>
                    ))
                  ) : (
                    <Content className="text-center text-gray-500 col-span-full">
                      No posts found. Please check your Algolia index or try a different search.
                    </Content>
                  )}
                </AnimatePresence>
              </div>

              {nbPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8 max-w-5xl mx-auto">
                  <button
                    disabled={currentPage === 0}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="w-12 h-12 rounded-full border border-gray-300 text-[var(--mid-shade)] bg-white hover:bg-[var(--mid-shade)] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                    aria-label="Previous page"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-gray-500 font-medium">
                    Page {currentPage + 1} of {nbPages}
                  </span>
                  <button
                    disabled={currentPage >= nbPages - 1}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="w-12 h-12 rounded-full border border-gray-300 text-[var(--mid-shade)] bg-white hover:bg-[var(--mid-shade)] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                    aria-label="Next page"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </InstantSearch>
          )}
        </section>
      </div>
    </Theme>
  );
}