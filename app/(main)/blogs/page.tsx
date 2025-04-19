import { Metadata } from 'next';
import { client } from '@/sanity/lib/client';
import { getAllPostsQuery } from '@/lib/queries/blog/getAllPosts';
import { getAllCategoriesQuery } from '@/lib/queries/blog/getAllCategories';
import BlogPage from '@/components/blocks/blog/BlogPage';
import { PostWithDoctor, Category } from '@/types';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Static metadata for SEO
export const metadata: Metadata = {
  title: 'Blog | Pediahelp',
  description: 'Explore helpful pediatric articles and resources.',
  openGraph: {
    title: 'Blog | Pediahelp',
    description: 'Explore helpful pediatric articles and resources.',
    url: 'https://pediahelp.com/blog',
    type: 'website',
    images: [
      {
        url: 'https://pediahelp.com/images/blog-og.jpg',
        width: 1200,
        height: 630,
      },
    ],
  },
  robots: 'index, follow',
};

// Server-side rendering with async component
export default async function BlogSSRPage() {
  const [fallbackPosts, categories]: [PostWithDoctor[], Category[]] = await Promise.all([
    client.fetch(getAllPostsQuery, {}, { cache: 'no-store' }),
    client.fetch(getAllCategoriesQuery, {}, { cache: 'no-store' }),
  ]);

  return <BlogPage fallbackPosts={fallbackPosts} categories={categories} />;
}