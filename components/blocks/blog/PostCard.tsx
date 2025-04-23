'use client';

import { Post } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

type CompatiblePost = Post & {
  slug?: { current?: string } | string;
  image?: { asset?: { url?: string } } | { url?: string } | null;
  imageUrl?: string;
};

interface PostCardProps {
  post: CompatiblePost;
}

export default function PostCard({ post }: PostCardProps) {
  const slug =
    typeof post.slug === 'string'
      ? post.slug
      : post.slug?.current || '';

  const title = post.title ?? 'Untitled';
  const excerpt = post.excerpt ?? '';

  const imageUrl =
    post.image && 'asset' in post.image
      ? post.image.asset?.url
      : (post.image as { url?: string })?.url ?? (post as any).imageUrl;

  return (
    <Link
      href={`/blog/${slug}`}
      className="group relative block overflow-hidden rounded-4xl shadow-sm transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label={`Read blog post: ${title}`}
    >
      {imageUrl && (
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      <div className="p-5 bg-white dark:bg-zinc-900 transition-colors duration-300">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-primary">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground dark:text-zinc-400 line-clamp-3 mb-3">
          {excerpt}
        </p>
        <span className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          Read more <ArrowRight className="ml-1 w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}