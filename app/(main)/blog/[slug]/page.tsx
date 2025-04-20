// Next.js 15 – Blog post page with clean structure & Tailwind styling

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from 'next/image';
import { PortableText } from '@portabletext/react';

import { getPostBySlug } from '@/lib/queries/blog/getPostBySlug';
import { formatDate } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import type { PostWithDoctor, Category } from '@/types';

// ---------- Types -----------------------------------------------------------
interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

interface PostHeaderProps {
  post: PostWithDoctor;
}

interface CoverImageProps {
  src: string;
  alt: string;
}

interface AuthorCardProps {
  doctor: NonNullable<PostWithDoctor['doctor']>;
}

// ---------- Metadata -------------------------------------------------------
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The blog post could not be found.',
    };
  }

  const { meta_title, meta_description, ogImage, mainImage, publishedAt, noindex } = post;
  const title = meta_title ?? post.title;
  const description = meta_description ?? post.excerpt;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${slug}`,
      images: [
        {
          url: ogImage?.asset?.url ?? mainImage?.asset?.url ?? (post.image?.asset?.url ?? ''),
          width: 1200,
          height: 630,
        },
      ],
      type: 'article',
      publishedTime: publishedAt,
    },
    robots: noindex ? 'noindex' : 'index, follow',
  };
}

// ---------- Components ------------------------------------------------------
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) return notFound();

  const hasDoctor = isValidDoctor(post.doctor);

  return (
    <article className="mx-auto max-w-3xl space-y-12 px-4 py-16">
      <PostHeader post={post} />
      {post.mainImage?.asset?.url && <CoverImage src={post.mainImage.asset.url} alt={post.title} />}
      <ContentSection content={post.body} />
      {hasDoctor && (
        <>
          <Separator className="my-12" />
          <AuthorCard doctor={post.doctor as NonNullable<PostWithDoctor['doctor']>} />
        </>
      )}
    </article>
  );
}

// ---------- Sub-components --------------------------------------------------
function PostHeader({ post }: PostHeaderProps) {
  const { title, publishedAt, categories, excerpt } = post;
  const categoryText = categories?.length ? ` • ${categories.map(c => c.title).join(', ')}` : '';

  return (
    <header className="space-y-4">
      <h1 className="text-4xl font-bold leading-tight text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground">
        {formatDate(publishedAt)}
        {categoryText}
      </p>
      {excerpt && <p className="text-lg text-muted-foreground">{excerpt}</p>}
    </header>
  );
}

function CoverImage({ src, alt }: CoverImageProps) {
  return (
    <figure className="relative h-64 w-full overflow-hidden rounded-lg md:h-96">
      <Image src={src} alt={alt} fill priority className="object-cover" />
    </figure>
  );
}

function ContentSection({ content }: { content: any }) {
  return (
    <section className="prose mx-auto max-w-none">
      <PortableText value={content} />
    </section>
  );
}

function AuthorCard({ doctor }: AuthorCardProps) {
  const { name, photo, specialty, experienceYears, expertise, whatsappNumber, appointmentFee } = doctor;

  return (
    <aside className="rounded-lg border border-border bg-muted/40 p-6">
      <h2 className="mb-4 text-xl font-semibold">About the Author</h2>
      <div className="flex flex-col items-start gap-4 md:flex-row">
        {photo?.asset?.url && (
          <Image
            src={photo.asset.url}
            alt={name}
            width={96}
            height={96}
            className="rounded-full border shadow-sm"
          />
        )}
        <div className="space-y-1">
          <p className="text-lg font-medium">
            {name}{' '}
            {specialty && <span className="text-sm text-muted-foreground">({specialty})</span>}
          </p>
          {experienceYears && (
            <p className="text-sm text-muted-foreground">{experienceYears} years of experience</p>
          )}
          {expertise?.length && <p className="text-sm text-muted-foreground">Expertise: {expertise.join(', ')}</p>}
          {whatsappNumber && <p className="text-sm text-muted-foreground">WhatsApp: {whatsappNumber}</p>}
          {appointmentFee && <p className="text-sm text-muted-foreground">Appointment Fee: ₹{appointmentFee}</p>}
        </div>
      </div>
    </aside>
  );
}

// ---------- Utilities -------------------------------------------------------
function isValidDoctor(doctor: PostWithDoctor['doctor'] | undefined): doctor is NonNullable<PostWithDoctor['doctor']> {
  return !!doctor && typeof doctor === 'object' && Object.keys(doctor).length > 0 && 'name' in doctor;
}

// ---------- Revalidation ----------------------------------------------------
export const revalidate = 60;
