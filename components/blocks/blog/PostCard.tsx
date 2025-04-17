'use client';
import Link from 'next/link';
import { PostWithDoctor } from '@/types';

interface PostCardProps {
  post: PostWithDoctor;
}

export default function PostCard({ post }: PostCardProps) {
  const imageUrl = post.image?.asset?.url || post.mainImage?.asset?.url;

  return (
    <Link href={`/blog/${post.slug.current}`} className="block">
      <div className="bg-white p-4 rounded-lg shadow">
        {imageUrl ? (
          <img src={imageUrl} alt={post.title} className="w-full h-48 object-cover rounded-t-lg" />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
            <span>{post.title.charAt(0)}</span>
          </div>
        )}
        <h3 className="text-xl font-bold mt-2">{post.title}</h3>
        <p className="text-gray-600 mt-1">{post.excerpt}</p>
        <time className="text-sm text-gray-400 mt-1">{new Date(post.publishedAt).toLocaleDateString()}</time>
      </div>
    </Link>
  );
}