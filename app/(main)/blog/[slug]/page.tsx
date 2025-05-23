// @/app/blog/[slug]/page.tsx
// External Imports
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { cn } from '@/lib/utils';
import Logo from '@/components/logo';


// Internal Components & Utilities
import Breadcrumbs from '@/components/ui/breadcrumbs';
import PortableTextRenderer from '@/components/portable-text-renderer';
import DoctorProfileCard from '@/components/blocks/doctor/DoctorProfile';
import BlogCommentForm from '@/components/blocks/forms/blog-comment-form';
import { Twitter, Facebook, Linkedin } from 'lucide-react';

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

  // Share URLs for social media
  const shareUrl = `https://yourdomain.com/blog/${slug}`; // Replace with your domain
  const shareTitle = post.title ?? 'Blog Post';
  const shareLinks = {
    twitter: `https://x.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareTitle)}`,
  };

  return (
    
    <section className="bg-background text-foreground">
      {/* Mobile-only SVG Logo */}
            <div className="w-full flex justify-center items-center bg-white lg:hidden">
              <Logo />
            </div>
      {/* Hero Section */}
      {imageUrl && (
        <div className="relative w-full h-[260px] sm:h-[400px] md:h-[600px] animate-fade-in">
          <Image
            src={imageUrl}
            alt={post.title || 'Blog Post'}
            fill
            priority
            className="object-cover w-full h-full object-top"
          />
          {/* Gradient Overlay with Percentage Control and Via Transparent */}
        </div>
      )}
      

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-10">
        {/* Post Content Section (Breadcrumbs, Title, Author, Body) */}
        <div className="post-content md:px-6 px-8">
          {/* Breadcrumb Navigation */}
          <div className="mb-4 opacity-80">
            <Breadcrumbs links={breadcrumbs} />
          </div>

          {/* Post Title */}
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            {post.title}
          </h1>

          {/* Title Underline */}
          <div className="h-px w-16 bg-dark-shade mb-4" />

          {/* Author Name Below Title */}
          {post.doctorAuthor?.name && (
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-6">
              By {post.doctorAuthor.name}, {post.doctorAuthor.specialty || 'Physician'}
            </p>
          )}

          {/* Blog Post Body */}
          {post.body && (
            <article className="prose prose-lg max-w-none text-foreground">
              <PortableTextRenderer value={post.body} />

              {/* Share Section */}
              <div className="mt-8 flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Share this post:
                </span>
                <a
                  href={shareLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on Twitter/X"
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a
                  href={shareLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on Facebook"
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
                <a
                  href={shareLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Share on LinkedIn"
                  className="text-gray-600 hover:text-primary transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>

              {/* Author Name at Bottom */}
              {post.doctorAuthor?.name && (
                <p className="mt-6 text-sm font-medium text-gray-700 dark:text-gray-300">
                  By {post.doctorAuthor.name}, {post.doctorAuthor.specialty || 'Physician'}
                </p>
              )}
            </article>
          )}
        </div>
      </div>

      {/* Wave Divider */}
      <div className="w-screen h-[100px] relative">
        <img
          src="/waves/white-to-dark-desktop-1.svg"
          alt="Wave divider desktop"
          className="hidden lg:block w-full h-full object-cover absolute top-0 left-0"
        />
        <img
          src="/waves/white-to-dark-mobile-1.svg"
          alt="Wave divider mobile"
          className="lg:hidden w-full h-full object-cover absolute top-0 left-0"
        />
      </div>

      {/* Author Section */}
      {post.doctorAuthor && (
        <>
          <div className="bg-dark-shade py-5">
            <div className="flex px-4 max-w-6xl mx-auto items-start animate-fade-in pt-5">
              {/* Doctor Profile Card Section */}
              <div className="flex flex-col sm:flex-row sm:gap-10 justify-start w-full">
                <div className="w-full flex flex-col gap-5 sm:gap-7">
                  <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-lg p-10 border border-white/20 flex justify-center items-center hover:shadow-xl transition-shadow">
                    <h2 className="sm:text-xl text-base sm:px-4 text-center uppercase font-bold text-white tracking-normal">
                      Get in touch with the Author
                    </h2>
                  </div>
                  <hr className="border-t border-white/30 w-3/4 mx-auto" />
                  <DoctorProfileCard
                    {...post.doctorAuthor}
                    reviews={post.doctorAuthor.reviews || []}
                  />
                  <hr className="border-t border-white/30 w-3/4 mx-auto" />
                </div>
                <div className="sm:ml-auto sm:min-w-md">
                  <BlogCommentForm
                    slug={slug}
                    blogTitle={post.title ?? 'Blog Post'}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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