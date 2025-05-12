'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { groq } from 'next-sanity';
import { urlFor } from '@/sanity/lib/image';
import { client } from '@/sanity/lib/client';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

import { Theme } from '@/components/ui/theme/Theme';
import { Title, Subtitle, Content } from '@/components/ui/theme/typography';
import PortableTextRenderer from '@/components/portable-text-renderer';
import { ArrowRight } from 'lucide-react';
import { PAGE_QUERYResult } from '@/sanity.types';

type Carousel1 = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>['blocks']>[number],
  { _type: 'carousel-1' }
>;

interface Carousel1Props extends Omit<NonNullable<Carousel1>, '_type' | '_key'> {}

interface Post {
  _id: string;
  title: string | null;
  slug: { current: string } | null;
  excerpt: string | null;
  image: {
    asset: {
      _id: string;
      url: string;
      mimeType: string;
      metadata: {
        lqip: string;
        dimensions: {
          width: number;
          height: number;
        };
      };
    };
    alt: string | null;
  } | null;
  categoryTitles?: string[];
}

const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const slug = post.slug?.current ?? '';
  const imageUrl = post.image?.asset?.url ? urlFor(post.image).url() : null;
  const categories = post.categoryTitles?.length ? post.categoryTitles.join(', ') : 'Uncategorized';

  return (
    <Link
      href={`/blog/${slug}`}
      className="group relative overflow-hidden rounded-4xl bg-white dark:bg-zinc-900 max-w-[300px] mx-auto min-h-[350px] flex flex-col shadow-md 
        transition-all duration-300 ease-out transform-gpu 
        hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] 
        active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 
        motion-safe:touch-manipulation z-10"
      aria-label={`Read blog post: ${post.title || 'Untitled'}`}
    >
      {imageUrl && (
        <div className="relative w-full h-48 overflow-hidden rounded-t-4xl">
          <Image
            src={imageUrl}
            alt={post.image?.alt || post.title || 'Blog Post Image'}
            fill
            sizes="(max-width: 640px) 100vw, 300px"
            className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-t-4xl"
          />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1 transition-colors duration-300">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-primary line-clamp-2">
          {post.title || 'Untitled'}
        </h3>

        {post.excerpt && (
          <p className="text-sm text-muted-foreground dark:text-zinc-400 line-clamp-3 mb-3 flex-1">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto">
          <span className="inline-flex items-center text-sm font-medium text-primary hover:underline transition-transform duration-150 group-active:scale-95">
            Read more <ArrowRight className="ml-1 w-4 h-4" />
          </span>
          <span className="inline-block bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full dark:bg-primary/20">
            {categories}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default function Carousel1({ theme, tagLine, title, body }: Carousel1Props) {
  const [posts, setPosts] = useState<Post[]>([]);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: 'center',
      dragFree: true,
      containScroll: 'trimSnaps',
    },
    [
      Autoplay({
        delay: 3000,
        stopOnInteraction: false,
      }),
    ]
  );

  // Snap to nearest card after drag ends
  const handleSnap = useCallback(() => {
    if (emblaApi) {
      emblaApi.scrollTo(emblaApi.selectedScrollSnap());
    }
  }, [emblaApi]);

  useEffect(() => {
    client
      .fetch(
        groq`
          *[_type == "post" && count(categories) > 0] | order(_createdAt desc)[0...12] {
            _id,
            title,
            slug,
            excerpt,
            image {
              asset->{
                _id,
                url,
                mimeType,
                metadata {
                  lqip,
                  dimensions {
                    width,
                    height
                  }
                }
              },
              alt
            },
            "categoryTitles": categories[]->title
          }
        `
      )
      .then((fetchedPosts) => {
        // Debug fetched posts
        console.log('Carousel Fetched Posts:', fetchedPosts);
        setPosts(fetchedPosts || []);
      })
      .catch((err) => console.error('Blog post fetch failed:', err));
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('pointerUp', handleSnap);
  }, [emblaApi, handleSnap]);

  const visiblePosts = posts;

  if (visiblePosts.length === 0) return null;

  return (
    <div className="w-full">
      {/* Header */}
      <Theme variant={theme || 'white'}>
        <div className="pt-10 pb-10 w-full mx-auto md:text-center">
          {tagLine && <Subtitle>{tagLine}</Subtitle>}
          {title && <Title>{title}</Title>}
          {body && (
            <Content as="div">
              <PortableTextRenderer value={body} />
            </Content>
          )}
        </div>
      </Theme>

      {/* Carousel */}
      <Theme variant={theme || 'white'} disableContainer className="!text-inherit">
        <div className="relative max-w-[1400px] mx-auto">
          {/* Left Fade */}
          <div className="pointer-events-none absolute left-0 top-0 h-full lg:w-64 w-10 z-10 bg-gradient-to-r from-[#264E53] via-20%-[#264E53] to-transparent" />
          {/* Right Fade */}
          <div className="pointer-events-none absolute right-0 top-0 h-full lg:w-64 w-10 z-10 bg-gradient-to-l from-[#264E53] via-20%-[#264E53] to-transparent" />

          <div ref={emblaRef} className="overflow-hidden px-4 pb-10 pt-2 relative z-0 mx-auto">
            <div className="flex gap-4 lg:gap-8">
              {visiblePosts.map((post, i) => (
                <div
                  key={`${post._id}-${i}`}
                  className="basis-[320px] flex-shrink-0 ml-6 lg:first:ml-8"
                >
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Theme>
    </div>
  );
}