import { Metadata } from 'next';
import BlogLanding from '@/components/blocks/blog/BlogLanding';

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

export default function BlogSSRPage() {
  return <BlogLanding />;
}