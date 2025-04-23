import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

import Breadcrumbs from '@/components/ui/breadcrumbs';
import PortableTextRenderer from '@/components/portable-text-renderer';
import DoctorProfileCard from '@/components/blocks/doctor/DoctorProfile';
import BlogQuestionForm from '@/components/blocks/forms/blog-question';
import { Separator } from '@/components/ui/separator';
import ShareButton from '@/components/blocks/blog/ShareButton';

import {
  fetchSanityPostBySlug,
  fetchSanityPostsStaticParams,
} from '@/sanity/lib/fetch';
import { generatePageMetadata } from '@/sanity/lib/metadata';

import type { POSTS_SLUGS_QUERYResult } from '@/sanity.types';
import type { BreadcrumbLink, PostWithDoctor } from '@/types';

// Define the correct type for Next.js dynamic params
interface PageParams {
  slug: string;
}

export async function generateStaticParams() {
  const posts: POSTS_SLUGS_QUERYResult = await fetchSanityPostsStaticParams();

  return posts
    .filter(
      (post): post is { slug: { _type: 'slug'; current: string } } =>
        typeof post.slug?.current === 'string' && post.slug._type === 'slug'
    )
    .map((post) => ({
      slug: post.slug.current,
    }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  // Resolve the params promise to get the slug
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  const post = await fetchSanityPostBySlug({ slug }) as PostWithDoctor;

  if (!post) notFound();

  return generatePageMetadata({
    page: post,
    slug: `/blog/${slug}`,
  });
}

export default async function PostPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  // Resolve the params promise to get the slug
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  
  const post = await fetchSanityPostBySlug({ slug }) as PostWithDoctor;

  if (!post) notFound();

  const links: BreadcrumbLink[] = [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: post.title || 'Post', href: '#' },
  ];

  const imageUrl =
    post.image?.asset?.url || (typeof post.image === 'string' ? post.image : undefined);

  return (
    <section className="bg-background text-foreground">
      {/* Hero Section with Image */}
      {imageUrl && (
        <div className="relative w-full h-[260px] sm:h-[400px] md:h-[480px] animate-fade-in">
          <Image
            src={imageUrl}
            alt={post.title || 'Blog Post'}
            fill
            priority
            className="object-cover w-full h-full"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />

          {/* Overlay meta row */}
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
      <div className="container max-w-4xl mx-auto px-4 md:px-6 py-10">
        {/* Breadcrumbs */}
        <div className="mb-4 opacity-80">
          <Breadcrumbs links={links} />
        </div>

        {/* Post Body */}
        {post.body && (
          <article className="prose dark:prose-invert prose-lg max-w-none text-foreground">
            <PortableTextRenderer value={post.body} />
          </article>
        )}

        {/* Author Section */}
        {post.doctorAuthor && (
          <>
            <Separator className="my-12" />
            <h2 className="text-xl font-semibold mb-6">About the Author</h2>
            <DoctorProfileCard 
              {...post.doctorAuthor} 
              reviews={post.doctorAuthor.reviews || []} 
            />
          </>
        )}

        {/* Blog Question Form */}
        <div className="mt-12 border-t pt-10">
          <h3 className="text-lg font-semibold mb-4">Have a question or comment?</h3>
          <BlogQuestionForm slug={slug} blogTitle={post.title ?? 'Blog post'} />
        </div>
      </div>
    </section>
  );
}