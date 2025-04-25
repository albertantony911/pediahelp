import { Metadata } from 'next';
import { fetchSanityBlogPreviews, fetchSanityCategories } from '@/sanity/lib/fetch';
import BlogPage from '@/components/blocks/blog/BlogPage';
import type { BlogPreview, Category } from '@/types';


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

export default async function BlogSSRPage() {
  const [fallbackPosts, categories]: [BlogPreview[], Category[]] = await Promise.all([
    fetchSanityBlogPreviews(),
    fetchSanityCategories(),
  ]);

  return <BlogPage fallbackPosts={fallbackPosts} categories={categories} />;
}