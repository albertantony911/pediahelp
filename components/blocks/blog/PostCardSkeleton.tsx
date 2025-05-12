'use client';

export default function PostCardSkeleton() {
  return (
    <div className="rounded-4xl bg-white dark:bg-zinc-900 w-full min-h-[350px] flex flex-col shadow-md animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full h-48 bg-gray-200 dark:bg-zinc-700 rounded-t-4xl" />

      {/* Content Skeleton */}
      <div className="p-5 flex flex-col flex-1">
        {/* Title Skeleton */}
        <div className="h-6 bg-gray-200 dark:bg-zinc-700 rounded w-3/4 mb-2" />

        {/* Excerpt Skeleton */}
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-full mb-1" />
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-5/6 mb-3" />

        {/* Read More Skeleton */}
        <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-1/4 mt-auto" />
      </div>
    </div>
  );
}