import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import PostHero from '@/components/blocks/post-hero';
import PortableTextRenderer from '@/components/portable-text-renderer';
import DoctorProfileCard from '@/components/blocks/doctor/DoctorProfile';
import { Separator } from '@/components/ui/separator';
import {
  fetchSanityPostBySlug,
  fetchSanityPostsStaticParams,
} from '@/sanity/lib/fetch';
import { generatePageMetadata } from '@/sanity/lib/metadata';
import type { POST_QUERYResult } from '@/sanity.types';
import type { BreadcrumbLink, Doctor, PostWithDoctor } from '@/types'; // Updated import

// Type to handle params as a promise
type PageParams = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const posts = await fetchSanityPostsStaticParams();
  return posts
    .filter((post) => post.slug?.current)
    .map((post) => ({ slug: post.slug!.current }));
}

export async function generateMetadata({ params }: { params: PageParams }) {
  const { slug } = await params;
  const post = (await fetchSanityPostBySlug({ slug })) as PostWithDoctor;

  if (!post) notFound();

  return generatePageMetadata({
    page: post,
    slug: `/blog/${slug}`, // Use resolved slug
  });
}

export default async function PostPage({ params }: { params: PageParams }) {
  const { slug } = await params;
  const post = (await fetchSanityPostBySlug({ slug })) as PostWithDoctor;

  if (!post) notFound();

  const links: BreadcrumbLink[] = [
    { label: 'Home', href: '/' },
    { label: 'Blog', href: '/blog' },
    { label: post.title || 'Post', href: '#' },
  ];

  const doctor = post.doctorAuthor;

  return (
    <section>
      <div className="container py-16 xl:py-20">
        <article className="max-w-3xl mx-auto space-y-12">
          <Breadcrumbs links={links} />
          <PostHero {...post} />
          {post.body && <PortableTextRenderer value={post.body} />}
          {doctor && (
            <>
              <Separator className="my-12" />
              <h2 className="text-xl font-semibold text-gray-800 mb-6">About the Author</h2>
              <DoctorProfileCard {...doctor} reviews={doctor.reviews || []} />
            </>
          )}
        </article>
      </div>
    </section>
  );
}