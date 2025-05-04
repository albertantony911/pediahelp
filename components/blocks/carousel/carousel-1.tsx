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
      className="group relative block overflow-hidden rounded-2xl shadow-md transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-white dark:bg-zinc-900 max-w-[300px] mx-auto"
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
      <div className="p-5 transition-colors duration-300">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-primary line-clamp-2">
          {post.title || "Untitled"}
        </h3>
        {post.excerpt && (
          <p className="text-sm text-muted-foreground dark:text-zinc-400 line-clamp-3 mb-3">
            {post.excerpt}
          </p>
        )}
        <span className="inline-flex items-center text-sm font-medium text-primary hover:underline">
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
      dragFree: true,
      align: 'start',
      slidesToScroll: 1,
      breakpoints: {
        '(max-width: 640px)': { slidesToScroll: 1, dragFree: false },
      },
    },
    [
      Autoplay({
        delay: 3000,
        stopOnInteraction: false,
      }),
    ]
  );

  useEffect(() => {
    client
      .fetch<Post[]>(
        groq`*[_type == "post" && defined(slug.current)] | order(_createdAt desc)[0...7] {
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

  if (posts.length === 0) return null;

  return (
    <Theme variant={theme || "white"}>
      <div className="flex flex-col gap-8 py-20 lg:pt-40">
        {/* Section Header */}
        <div className="w-full mx-auto md:text-center">
          {tagLine && <Subtitle>{tagLine}</Subtitle>}
          {title && <Title>{title}</Title>}
          {body && (
            <Content as="div">
              <PortableTextRenderer value={body} />
            </Content>
          )}
        </div>

        {/* Carousel */}
        <div className="w-full mx-auto max-w-[640px] sm:max-w-[768px] md:max-w-[1024px] lg:max-w-[1280px] xl:max-w-[1440px] overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {posts.map((post) => (
              <div
                key={post._id}
                className="flex-[0_0_100%] sm:flex-[0_0_33.33%] lg:flex-[0_0_25%] pl-3 sm:pl-4 md:pl-5"
              >
                <PostCard post={post} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Theme>
  );
}