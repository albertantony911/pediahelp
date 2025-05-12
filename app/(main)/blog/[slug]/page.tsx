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
import { Separator } from '@/components/ui/separator';
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
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
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
      <div className="max-w-6xl mx-auto px-8 md:px-6 py-10">
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
          <article
              className={cn(
                'prose prose-lg max-w-none text-black/80 dark:text-gray-200',
                'prose-headings:text-gray-900 dark:prose-headings:text-white',
                'prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-2xl prose-h2:font-semibold',
                'prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-xl prose-h3:font-medium',
                'prose-p:leading-7 prose-p:mb-5',
                'prose-img:rounded-lg prose-img:shadow-md prose-img:my-8',
                'prose-a:text-primary hover:prose-a:underline',
                'prose-strong:text-gray-900 dark:prose-strong:text-white',
                'prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:text-muted-foreground',
                'prose-ul:ml-6 prose-ol:ml-6 prose-li:marker:text-primary',
                'prose-table:table-auto prose-th:px-4 prose-td:px-4'
              )}
            >
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
          <h3 className="text-lg font-semibold mb-4">
            Have a question or comment?
          </h3>
          <BlogQuestionForm slug={slug} blogTitle={post.title ?? 'Blog Post'} />
        </div>
      </div>
    </section>
  );
}