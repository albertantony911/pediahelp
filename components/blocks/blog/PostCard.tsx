'use client';

import { PostWithDoctor } from '@/types';
import Link from 'next/link';
import Image from 'next/image';

interface PostCardProps {
  post: PostWithDoctor;
}

export default function PostCard({ post }: PostCardProps) {
  const imageUrl = post.image?.asset?.url || (post as any).imageUrl;
  const slug = post.slug?.current ?? '';
  const title = post.title ?? 'Untitled';
  const excerpt = post.excerpt ?? '';

  return (
    <Link
      href={`/blog/${post.slug}`}
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
            priority={false}
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