'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
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

const POSTS_PER_PAGE = 12;

export default function BlogLanding({ theme = 'dark-shade' }: BlogLandingProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const blogSectionRef = useRef<HTMLElement | null>(null);

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
        const fetchedCategories = (data.categories || []).filter(
          (cat: Category) => cat._id !== 'all' && cat.title.toLowerCase() !== 'all'
        );
        setCategories(fetchedCategories);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching Sanity categories:', error);
        setIsLoading(false);
      });
  }, []);

  return (
    <>
      {/* Mobile-only SVG Logo (Outside Theme) */}
      <div className="w-full flex justify-center items-center bg- lg:hidden">
        <Logo />
      </div>

      {/* Themed Content */}
      <Theme variant={theme || 'dark-shade'}>
        <div className="w-full">
          <section
            ref={blogSectionRef}
            className="mx-auto pt-12 lg:pt-48"
          >
            <div className="sm:text-center max-w-4xl mx-auto mb-8 text-left">
              <Subtitle>Resource Hub</Subtitle>
              <Title>Trusted parenting and childcare guide</Title>
              <Content>
                Get expert tips, answers to common concerns, and practical guidance for every stage of your child’s growth.
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
                <Configure hitsPerPage={POSTS_PER_PAGE} />
                <BlogSearchAlgolia />
                <BlogCategoryFilter categories={[{ _id: 'all', title: 'All' }, ...categories]} />
                <BlogHits scrollTargetRef={blogSectionRef} />
              </InstantSearch>
            )}
          </section>
        </div>
      </Theme>
    </>
  );
}

function BlogHits({ scrollTargetRef }: { scrollTargetRef: React.RefObject<HTMLElement> }) {
  const { hits } = useHits<Post>();
  const { currentRefinement: currentPage, nbPages, refine: setPage } = usePagination();
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToTop = () => {
    // Clear any existing timeout to prevent multiple scrolls
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Delay scroll to ensure DOM is updated after hits render
    scrollTimeoutRef.current = setTimeout(() => {
      if (scrollTargetRef.current) {
        const offset = scrollTargetRef.current.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 100);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mt-10 lg:mt-16 max-w-6xl mx-auto"
      >
        <AnimatePresence mode="wait">
          {hits.length > 0 ? (
            hits.map((post: Post, index: number) => (
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
            <Content className="text-center text-gray-600 col-span-full">
              No posts found. Try a different search or category.
            </Content>
          )}
        </AnimatePresence>
      </div>

      {nbPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-12 max-w-5xl mx-auto px-4">
          <button
            disabled={currentPage === 0}
            onClick={() => {
              setPage(currentPage - 1);
              scrollToTop();
            }}
            className="group w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full border border-gray-300 bg-white text-[var(--mid-shade)] hover:bg-[var(--mid-shade)] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--mid-shade)]"
            aria-label="Previous page"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 group-hover:-translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="text-sm sm:text-base text-gray-500 font-medium">
            Page <strong>{currentPage + 1}</strong> of <strong>{nbPages}</strong>
          </span>

          <button
            disabled={currentPage >= nbPages - 1}
            onClick={() => {
              setPage(currentPage + 1);
              scrollToTop();
            }}
            className="group w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full border border-gray-300 bg-white text-[var(--mid-shade)] hover:bg-[var(--mid-shade)] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--mid-shade)]"
            aria-label="Next page"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}