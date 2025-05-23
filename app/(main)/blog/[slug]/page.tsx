// @/app/blog/[slug]/page.tsx

export const revalidate = 60; // ISR every 60 seconds

import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { cn } from '@/lib/utils';
import Logo from '@/components/logo';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import PortableTextRenderer from '@/components/portable-text-renderer';
import DoctorProfileCard from '@/components/blocks/doctor/DoctorProfile';
import BlogCommentForm from '@/components/blocks/forms/blog-comment-form';
import ShareButtons from '@/components/ui/ShareButtons';

import {
  fetchSanityPostBySlug,
  fetchSanityPostsStaticParams,
} from '@/sanity/lib/fetch';
import { generatePageMetadata } from '@/sanity/lib/metadata';

import type { POSTS_SLUGS_QUERYResult } from '@/sanity.types';
import type { BreadcrumbLink, PostWithDoctor } from '@/types';

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
    .map(({ slug }) => ({ slug: slug.current }));
}

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

  const breadcrumbs: BreadcrumbLink[] = [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: post.title || 'Post', href: '#' },
  ];

  const imageUrl =
    post.image?.asset?.url ||
    (typeof post.image === 'string' ? post.image : undefined);

  const shareUrl = `https://yourdomain.com/blog/${slug}`;
  const shareTitle = post.title ?? 'Blog Post';

  return (
    <section className="bg-background text-foreground">
      <div className="w-full flex justify-center items-center bg-white lg:hidden">
        <Logo />
      </div>

      {imageUrl && (
        <div className="relative w-full h-[260px] sm:h-[400px] md:h-[600px] animate-fade-in">
          <Image
            src={imageUrl}
            alt={post.title || 'Blog Post'}
            fill
            priority
            className="object-cover w-full h-full object-top"
          />
        </div>
      )}

      <div className="max-w-6xl mx-auto py-10">
        <div className="post-content md:px-6 px-8">
          <div className="mb-4 opacity-80">
            <Breadcrumbs links={breadcrumbs} />
          </div>

          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            {post.title}
          </h1>

          <div className="h-px w-16 bg-dark-shade mb-4" />

          {post.doctorAuthor?.name && (
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-6">
              By {post.doctorAuthor.name}, {post.doctorAuthor.specialty || 'Physician'}
            </p>
          )}

          {post.body && (
            <article className="prose prose-lg max-w-none text-foreground">
              <PortableTextRenderer value={post.body} />
              <ShareButtons url={shareUrl} title={shareTitle} />
              {post.doctorAuthor?.name && (
                <p className="mt-6 text-sm font-medium text-gray-700 dark:text-gray-300">
                  By {post.doctorAuthor.name}, {post.doctorAuthor.specialty || 'Physician'}
                </p>
              )}
            </article>
          )}
        </div>
      </div>

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

      {post.doctorAuthor && (
        <div className="bg-dark-shade py-5">
          <div className="flex px-4 max-w-6xl mx-auto items-start animate-fade-in pt-5">
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
      )}

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
