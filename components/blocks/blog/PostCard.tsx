import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { urlFor } from "@/sanity/lib/image";
import { ArrowRight } from "lucide-react";
import type { PostWithDoctor } from "@/types";

type AlgoliaPost = PostWithDoctor & { objectID?: string };

interface PostCardProps {
  post: AlgoliaPost;
  className?: string;
}

export default function PostCard({ post, className }: PostCardProps) {
  const { title, excerpt } = post;
  const slug = typeof post.slug === "string" ? post.slug : post.slug?.current ?? "";

  // Image URL logic from the working component, adapted for Sanity
  const imageUrl =
    post.image && "asset" in post.image
      ? urlFor(post.image).url() // Use urlFor for Sanity images
      : (post.image as { url?: string })?.url ?? (post as any).imageUrl;

  return (
    <Link
      href={`/blog/${slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-4xl shadow-sm transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        className
      )}
      aria-label={`Read blog post: ${title || "Untitled"}`}
    >
      {imageUrl && (
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={imageUrl}
            alt={post.image?.alt || title || "Blog Post Image"}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-5 bg-white dark:bg-zinc-900 transition-colors duration-300">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-snug group-hover:text-primary">
          {title || "Untitled"}
        </h3>
        {excerpt && (
          <p className="text-sm text-muted-foreground dark:text-zinc-400 line-clamp-3 mb-3">
            {excerpt}
          </p>
        )}
        <span className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          Read more <ArrowRight className="ml-1 w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}