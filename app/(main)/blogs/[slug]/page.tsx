import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';
import { PortableText } from '@portabletext/react';
import { getPostBySlug } from '@/lib/queries/blog/getPostBySlug';
import { formatDate } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { PostWithDoctor } from '@/types';

// Correctly typed props for Next.js 15
interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

// SEO metadata generation
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params; // Await params to resolve the slug
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
      description: 'The blog post could not be found.',
    };
  }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${post.slug.current}`,
      images: [
        {
          url: post.ogImage?.asset?.url || post.mainImage?.asset?.url || '',
          width: 1200,
          height: 630,
        },
      ],
      type: 'article',
      publishedTime: post.publishedAt,
    },
    robots: post.noindex ? 'noindex' : 'index, follow',
  };
}

// Main component
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params; // Await params to resolve the slug
  const post = await getPostBySlug(slug);

  if (!post) return notFound();

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {/* Title + Meta */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">{post.title}</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Published on {formatDate(post.publishedAt)}
          {post.categories?.length && (
            <> • {post.categories.map((cat) => cat.title).join(', ')}</>
          )}
        </p>
        {post.excerpt && <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>}
      </header>

      {/* Cover Image */}
      {post.mainImage?.asset?.url && (
        <div className="relative mb-10 h-64 w-full md:h-96 overflow-hidden rounded-lg">
          <Image
            src={post.mainImage.asset.url}
            alt={post.title}
            fill
            priority
            className="object-cover"
          />
        </div>
      )}

      {/* Body */}
      <section className="prose dark:prose-invert prose-neutral max-w-none">
        <PortableText value={post.body} />
      </section>

      {/* Author Info */}
      {post.doctor && (
        <>
          <Separator className="my-12" />
          <aside className="mt-8 p-6 rounded-lg border border-border bg-muted/30">
            <h2 className="text-xl font-semibold mb-4">About the Author</h2>
            <div className="flex flex-col md:flex-row items-start gap-4">
              {post.doctor.photo?.asset?.url && (
                <Image
                  src={post.doctor.photo.asset.url}
                  alt={post.doctor.name}
                  width={96}
                  height={96}
                  className="rounded-full border shadow-sm"
                />
              )}
              <div>
                <p className="text-lg font-medium">
                  {post.doctor.name}{' '}
                  <span className="text-sm text-muted-foreground">({post.doctor.specialty})</span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {post.doctor.experienceYears
                    ? `${post.doctor.experienceYears} years of experience`
                    : 'Experienced practitioner'}
                </p>
                {!!post.doctor.expertise?.length && (
                  <p className="text-sm text-muted-foreground">
                    Expertise: {post.doctor.expertise.join(', ')}
                  </p>
                )}
                {post.doctor.whatsappNumber && (
                  <p className="text-sm text-muted-foreground mt-1">
                    WhatsApp: {post.doctor.whatsappNumber}
                  </p>
                )}
                {post.doctor.appointmentFee && (
                  <p className="text-sm text-muted-foreground">
                    Appointment Fee: ₹{post.doctor.appointmentFee}
                  </p>
                )}
              </div>
            </div>
          </aside>
        </>
      )}
    </article>
  );
}

// Enable Incremental Static Regeneration
export const revalidate = 60;