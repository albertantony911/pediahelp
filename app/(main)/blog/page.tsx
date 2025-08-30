import { Metadata } from 'next';
import BlogLanding from '@/components/blocks/blog/BlogLanding';
import WaveDivider from '@/components/blocks/wave-divider';

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
      <WaveDivider
        desktopSrc="/waves/dark-to-white-desktop-1.svg"
        mobileSrc="/waves/dark-to-white-mobile-1.svg"
        height={100}
        bleed
      />
    </div>
  );
}