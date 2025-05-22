import { Metadata } from 'next';
import BlogLanding from '@/components/blocks/blog/BlogLanding';

export const metadata: Metadata = {
  title: 'Knowledge Hub | Pediahelp',
  description:
    'We believe every child has a unique spark. Explore expert-written pediatric resources to spark curiosity and inspire creativity at Pediahelp.',
  openGraph: {
    title: 'Knowledge Hub | Pediahelp',
    description:
      'We believe every child has a unique spark. Explore expert-written pediatric resources to spark curiosity and inspire creativity at Pediahelp.',
    url: 'https://pediahelp.vercel.app/blog',
    type: 'website',
    images: [
      {
        url: 'https://pediahelp.vercel.app/images/blog-og.jpg',
        width: 1200,
        height: 630,
      },
    ],
  },
  robots: 'index, follow',
};

export default function BlogSSRPage() {
  return (
    <div className="relative">
      <BlogLanding />
      {/* Wave Divider Section */}
      <div className="relative w-full h-[100px] overflow-hidden">
        <picture>
          <source
            media="(min-width: 1024px)"
            srcSet="/waves/dark-to-white-desktop-1.svg"
          />
          <img
            src="/waves/dark-to-white-mobile-1.svg"
            alt="Wave divider"
            className="w-full h-full object-cover absolute top-0 left-0"
          />
        </picture>
      </div>
    </div>
  );
}