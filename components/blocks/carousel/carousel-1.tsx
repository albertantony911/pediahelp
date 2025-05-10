'use client';

import { useEffect, useState } from 'react';
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
import { ArrowRight } from "lucide-react";
import { PAGE_QUERYResult } from "@/sanity.types";

type Carousel1 = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
  { _type: "carousel-1" }
>;

interface Carousel1Props extends Omit<NonNullable<Carousel1>, "_type" | "_key"> {}

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
}

const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const slug = post.slug?.current ?? "";
  const imageUrl = post.image?.asset?.url ? urlFor(post.image).url() : null;

  return (
    <Link
      href={`/blog/${slug}`}
      className="group relative overflow-hidden rounded-4xl shadow-sm transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-white dark:bg-zinc-900 max-w-[300px] mx-auto min-h-[350px] flex flex-col"
      aria-label={`Read blog post: ${post.title || "Untitled"}`}
    >
      {imageUrl && (
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={imageUrl}
            alt={post.image?.alt || post.title || "Blog Post Image"}
            fill
            sizes="(max-width: 640px) 100vw, 300px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-5 flex flex-col flex-1 transition-colors duration-300">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-primary line-clamp-2">
          {post.title || "Untitled"}
        </h3>
        {post.excerpt && (
          <p className="text-sm text-muted-foreground dark:text-zinc-400 line-clamp-3 mb-3 flex-1">
            {post.excerpt}
          </p>
        )}
        <span className="inline-flex items-center text-sm font-medium text-primary hover:underline mt-auto">
          Read more <ArrowRight className="ml-1 w-4 h-4" />
        </span>
      </div>
    </Link>
  );
};

export default function Carousel1({ theme, tagLine, title, body }: Carousel1Props) {
  const [posts, setPosts] = useState<Post[]>([]);

  const [emblaRef] = useEmblaCarousel(
    {
      loop: true,
      align: 'center',
      dragFree: true,
      slidesToScroll: 1,
    },
    [
      Autoplay({
        delay: 2000,
        stopOnInteraction: false,
      }),
    ]
  );

  useEffect(() => {
    client
      .fetch<Post[]>(
        groq`*[_type == "post" && defined(slug.current)] | order(_createdAt desc)[0...5] {
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
          }
        }`
      )
      .then(setPosts)
      .catch((err) => console.error('Blog post fetch failed:', err));
  }, []);

  // Duplicate posts if fewer than 6 to ensure infinite scroll works
  const visiblePosts = posts.length < 6 ? [...posts, ...posts, ...posts] : posts;

  if (posts.length === 0) return null;

  return (
    <div className="w-full">
      {/* Header Section */}
      <Theme variant={theme || "white"}>
        <div className="pt-10 pb-10 w-full mx-auto md:text-center ">
          {tagLine && <Subtitle>{tagLine}</Subtitle>}
          {title && <Title>{title}</Title>}
          {body && (
            <Content as="div">
              <PortableTextRenderer value={body} />
            </Content>
          )}
        </div>
      </Theme>

{/* Carousel Section */}
<Theme variant={theme || "white"} disableContainer className="!text-inherit">
  {/* Wrap only the carousel in a relative container for fades */}
  <div className="relative max-w-[1400px] mx-auto">
    {/* Smooth Left Fade */}
    <div className="pointer-events-none absolute left-0 top-0 h-full lg:w-64 w-10 z-10 bg-gradient-to-r from-[#264E53] via-20%-[#264E53]  to-transparent" />
    {/* Smooth Right Fade */}
    <div className="pointer-events-none absolute right-0 top-0 h-full lg:w-64 w-10 z-10 bg-gradient-to-l from-[#264E53] via-20%-[#264E53]  to-transparent" />

    <div ref={emblaRef} className="overflow-hidden px-4 pb-10 relative z-0">
      <div className="flex gap-4 lg:gap-8">
        {visiblePosts.map((post, i) => (
          <div
            key={`${post._id}-${i}`}
            className="basis-[320px] flex-shrink-0 ml-4 lg:first:ml-8"
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