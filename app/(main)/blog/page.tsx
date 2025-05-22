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
    <div>
      <BlogLanding />
      {/* Wave Divider Section */}
      <div className="w-screen -mx-[calc(50vw-50%)] h-[100px] relative">
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
    </div>
  );
}