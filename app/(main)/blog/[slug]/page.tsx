// @/app/blog/[slug]/page.tsx
// External Imports
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { cn } from '@/lib/utils';

// Internal Components & Utilities
import Breadcrumbs from '@/components/ui/breadcrumbs';
import PortableTextRenderer from '@/components/portable-text-renderer';
import DoctorProfileCard from '@/components/blocks/doctor/DoctorProfile';
import BlogQuestionForm from '@/components/blocks/forms/blog-question';
import ShareButton from '@/components/blocks/blog/ShareButton';

// Data Fetching & Metadata
import {
  fetchSanityPostBySlug,
  fetchSanityPostsStaticParams,
} from '@/sanity/lib/fetch';
import { generatePageMetadata } from '@/sanity/lib/metadata';

// Types
import type { POSTS_SLUGS_QUERYResult } from '@/sanity.types';
import type { BreadcrumbLink, PostWithDoctor } from '@/types';

// Define dynamic route parameters
interface PageParams {
  slug: string;
}

// Generate static parameters for Next.js pages
export async function generateStaticParams() {
  const posts: POSTS_SLUGS_QUERYResult = await fetchSanityPostsStaticParams();

  return posts
    .filter(
      (post): post is { slug: { _type: 'slug'; current: string } } =>
        typeof post.slug?.current === 'string' && post.slug._type === 'slug'
    )
    .map(({ slug }) => ({ slug: slug.current }));
}

// Generate metadata for the page based on the blog post content
export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = (await fetchSanityPostBySlug({ slug })) as PostWithDoctor;

  if (!post) {
    notFound();
  }

  return generatePageMetadata({
    page: post,
    slug: `/blog/${slug}`,
  });
}

// Main Blog Post Page Component
export default async function PostPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { slug } = await params;
  const post = (await fetchSanityPostBySlug({ slug })) as PostWithDoctor;

  if (!post) {
    notFound();
  }

  // Prepare Breadcrumbs with full title
  const breadcrumbs: BreadcrumbLink[] = [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: post.title || 'Post', href: '#' },
  ];

  // Determine the image URL
  const imageUrl =
    post.image?.asset?.url ||
    (typeof post.image === 'string' ? post.image : undefined);

  return (
    <section className="bg-background text-foreground">
      {/* Hero Section */}
      {imageUrl && (
        <div className="relative w-full h-[260px] sm:h-[400px] md:h-[480px] animate-fade-in">
          <Image
            src={imageUrl}
            alt={post.title || 'Blog Post'}
            fill
            priority
            className="object-cover w-full h-full"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
          {/* Meta Row Overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
            {post.doctorAuthor?.name && (
              <div className="bg-white/90 text-gray-800 text-sm font-medium px-4 py-2 rounded-full shadow-md">
                {post.doctorAuthor.name}
              </div>
            )}
            <ShareButton slug={slug} title={post.title ?? 'Blog Post'} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-10">
        {/* Post Content Section (Breadcrumbs, Title, Body) */}
        <div className="post-content md:px-6 px-8">
          {/* Breadcrumb Navigation */}
          <div className="mb-4 opacity-80">
            <Breadcrumbs links={breadcrumbs} />
          </div>

          {/* Post Title */}
          <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            {post.title}
          </h1>

          <div className="h-px w-16 bg-dark-shade mb-6" />

          {/* Blog Post Body */}
          {post.body && (
            <article className="prose prose-lg max-w-none text-foreground">
              <PortableTextRenderer value={post.body} />
              {/* Author Byline */}
              {post.doctorAuthor?.name && (
                <p className="mt-6 text-sm italic text-gray-600 dark:text-gray-300">
                  Written by our expert{' '}
                  {post.doctorAuthor.specialty || 'Physician'},{' '}
                  {post.doctorAuthor.name}
                </p>
              )}
            </article>
          )}
        </div>

        {/* Author Section */}
        {post.doctorAuthor && (
          <>
            <div className="my-6 opacity-50 h-px w-[90%] mx-auto sm:w-full bg-gray-300 dark:bg-gray-600" />
            <div className="flex flex-col px-4 items-start gap-4 animate-fade-in">
              {/* Doctor Profile Card */}
              <div className="flex-1">
                <DoctorProfileCard
                  {...post.doctorAuthor}
                  reviews={post.doctorAuthor.reviews || []}
                />
              </div>
            </div>
          </>
        )}

        {/* Blog Question Form */}
        <div className="mt-12 ">

          <BlogQuestionForm slug={slug} blogTitle={post.title ?? 'Blog Post'} />
        </div>
      </div>

      {/* Wave Divider */}
      <div className="w-screen h-[100px] relative">
        <img
          src="/waves/dark-to-white-desktop-1.svg"
          alt="Wave divider desktop"
          className="hidden lg:block w-full h-full object-cover absolute top-0 left-0"
        />
        <img
          src="/waves/dark-to-white-mobile-1.svg"
          alt="Wave divider mobile"
          className="lg:hidden w-full h-full object-cover absolute top-0 left-0"
        />
      </div>
    </section>
  );
}