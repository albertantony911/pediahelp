'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { groq } from 'next-sanity';
import { urlFor } from '@/sanity/lib/image';
import { client } from '@/sanity/lib/client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
  CarouselCounter,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { PAGE_QUERYResult } from "@/sanity.types";
import { Theme } from '@/components/ui/theme/Theme';
import { Title, Subtitle, Content } from '@/components/ui/theme/typography';
import PortableTextRenderer from '@/components/portable-text-renderer';
import { ArrowRight } from "lucide-react";

const CAROUSEL_SIZES = {
  one: "basis-full",
  two: "basis-full md:basis-1/2",
  three: "basis-full md:basis-1/2 lg:basis-1/3",
} as const;

type CarouselSize = keyof typeof CAROUSEL_SIZES;

type Carousel1 = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
  { _type: "carousel-1" }
>;

interface Carousel1Props
  extends Omit<NonNullable<Carousel1>, "_type" | "_key"> {
  size: CarouselSize | null;
  indicators: "none" | "dots" | "count" | null;
}

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
      className="group relative block overflow-hidden rounded-2xl shadow-sm transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-white dark:bg-zinc-900"
      aria-label={`Read blog post: ${post.title || "Untitled"}`}
    >
      {imageUrl && (
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={imageUrl}
            alt={post.image?.alt || post.title || "Blog Post Image"}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-5 transition-colors duration-300">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-primary">
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

export default function Carousel1({
  theme,
  tagLine,
  title,
  body,
  size = "one",
  indicators = "none",
}: Carousel1Props) {
  const [posts, setPosts] = useState<Post[]>([]);

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
        <Carousel>
          <CarouselContent>
            {posts.map((post) => (
              <CarouselItem
                key={post._id}
                className={cn(CAROUSEL_SIZES[size as CarouselSize], "px-2")}
              >
                <PostCard post={post} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious
            variant="secondary"
            className="-left-3 md:-left-8 xl:-left-12"
          />
          <CarouselNext
            variant="secondary"
            className="-right-3 md:-right-8 xl:-right-12"
          />
          {indicators !== "none" && (
            <div className="w-full flex justify-center">
              {indicators === "dots" && <CarouselDots />}
              {indicators === "count" && <CarouselCounter />}
            </div>
          )}
        </Carousel>
      </div>
    </Theme>
  );
}