import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';
import { PortableText } from '@portabletext/react';

import PostCommentForm from '@/components/blocks/blog/PostCommentForm';
import PostComments from '@/components/blocks/blog/PostComments';
import DoctorProfileCard from '@/components/blocks/doctor/DoctorProfile';
import { getPostBySlug } from '@/lib/queries/blog/getPostBySlug';

export const revalidate = 60;

// Update BlogPostPageProps to handle params as a Promise
type BlogPostPageProps = {
  params: Promise<{ slug: string }>;
};

// Update generateMetadata to handle async params
export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params; // Resolve the Promise
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'Sorry, this blog post does not exist.',
    };
  }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || '',
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || '',
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${slug}`,
      images: post.ogImage?.asset?.url
        ? [{ url: post.ogImage.asset.url, width: 1200, height: 630, alt: post.title }]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || '',
      images: post.ogImage?.asset?.url ? [post.ogImage.asset.url] : [],
    },
  };
}

// Update BlogPostPage to handle async params
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params; // Resolve the Promise
  const post = await getPostBySlug(slug);

  if (!post) return notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {post.mainImage?.asset?.url && (
        <Image
          src={post.mainImage.asset.url}
          alt={post.title}
          width={1200}
          height={630}
          className="w-full h-auto rounded-xl mb-6 object-cover"
        />
      )}
      <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
      <p className="text-sm text-gray-600 mb-4">
        Published on {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
      </p>
      {post.excerpt && <p className="text-lg text-gray-700 mb-6">{post.excerpt}</p>}
      <div className="prose max-w-none">
        <PortableText value={post.body} />
      </div>
      <section className="mt-12 space-y-10">
        <div>
          <h3 className="text-xl font-semibold mb-4">Leave a Comment</h3>
          <PostCommentForm postId={post._id} />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-4">Comments</h3>
          <PostComments postId={post._id} />
        </div>
      </section>
      {post.doctor && (
        <>
          <hr className="my-10" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">About the Author</h2>
          <DoctorProfileCard
            name={post.doctor.name}
            specialty={post.doctor.specialty}
            photo={post.doctor.photo}
            expertise={post.doctor.expertise}
            experienceYears={post.doctor.experienceYears}
            whatsappNumber={post.doctor.whatsappNumber}
            slug={post.doctor.slug.current}
            appointmentFee={post.doctor.appointmentFee ?? 0}
            reviews={post.doctor.reviews ?? []}
          />
        </>
      )}
    </article>
  );
}