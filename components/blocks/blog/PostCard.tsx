'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

interface Post {
  _id: string;
  title: string | null;
  slug: { current?: string } | null;
  excerpt: string | null;
  image?: {
    asset?: {
      url?: string | null;
    } | null;
    alt?: string | null;
  } | null;
  imageUrl?: string;
  imageAlt?: string;
  categoryTitles?: string[];
}

interface Props {
  post: Post;
  className?: string;
}

export default function PostCard({ post, className }: Props) {
  const slug = typeof post.slug?.current === 'string' ? post.slug.current : '';
  const imageUrl = post.image?.asset?.url ?? post.imageUrl ?? null;
  const imageAlt = post.image?.alt ?? post.imageAlt ?? post.title ?? 'Blog Post Image';
  const categories = post.categoryTitles?.length ? post.categoryTitles.join(', ') : 'Uncategorized';

  return (
    <Link
      href={`/blog/${slug}`}
      className={`group relative overflow-hidden rounded-4xl bg-white w-full min-h-[350px] flex flex-col shadow-md transition-all duration-300 ease-out transform-gpu 
        hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] 
        active:scale-95 focus:outline-none focus:ring-2 focus:ring-[var(--mid-shade)] focus:ring-offset-2 
        motion-safe:touch-manipulation ${className || ''}`}
      aria-label={`Read blog post: ${post.title || 'Untitled'}`}
    >
      {imageUrl ? (
        <div className="relative w-full h-48 overflow-hidden ">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes="(max-width: 640px) 100vw, 300px"
            className="object-cover transition-transform duration-300 group-hover:scale-105 rounded-t-4xl"
          />
        </div>
      ) : (
        <div className="w-full h-48 bg-muted flex items-center justify-center text-sm text-gray-500 rounded-t-4xl">
          No image available
        </div>
      )}

      <div className="p-5 flex flex-col flex-1 transition-colors duration-300">
        <h3 className="text-lg font-bold text-zinc-800 mb-2 leading-snug group-hover:text-[var(--mid-shade)] line-clamp-2">
          {post.title || 'Untitled'}
        </h3>

        {post.excerpt && (
          <p className="text-sm text-zinc-600 line-clamp-3 mb-3 flex-1">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto">
          <span className="inline-block bg-zinc-200/60 text-zinc-700 text-xs font-medium px-2 py-1 rounded-full">
            {categories}
          </span>
          <span className="inline-flex items-center text-sm font-medium text-zinc-700 hover:underline">
            Read more <ArrowRight className="mr-1 w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
