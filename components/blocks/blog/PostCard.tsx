'use client';

import { Post } from '@/types';
import Link from 'next/link';
import Image from 'next/image';

// Can also import AlgoliaPost if you made a type for it
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

  // Image URL fallback logic
  const imageUrl =
    post.image && 'asset' in post.image
      ? post.image.asset?.url
      : (post.image as { url?: string })?.url ?? (post as any).imageUrl;

  return (
    <Link
      href={`/blog/${slug}`}
      className="block border rounded-lg overflow-hidden transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label={`Read blog post: ${title}`}
    >
      {imageUrl && (
        <div className="relative w-full h-48">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <div className="p-4 bg-white dark:bg-zinc-900">
        <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-3">{excerpt}</p>
      </div>
    </Link>
  );
}