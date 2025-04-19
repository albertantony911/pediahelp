'use client';

import { PostWithDoctor } from '@/types';
import Link from 'next/link';

export default function PostCard({ post }: { post: PostWithDoctor }) {
  const imageUrl = post.image?.asset?.url || (post as any).imageUrl;

  return (
    <Link href={`/blog/${post.slug.current}`}>
      <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={post.title}
            className="w-full h-48 object-cover"
          />
        )}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
          <p className="text-sm text-gray-600 line-clamp-3">{post.excerpt}</p>
        </div>
      </div>
    </Link>
  );
}