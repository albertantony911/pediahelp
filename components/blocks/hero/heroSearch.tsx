'use client';

import Image from 'next/image';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch } from 'react-instantsearch';
import { urlFor } from '@/sanity/lib/image';
import PortableTextRenderer from '@/components/portable-text-renderer';
import DoctorSearchBar from '@/components/blocks/doctor/DoctorSearchHero';

interface HeroSearchSectionProps {
  tagLine?: string;
  title: string;
  body?: any;
  image?: any;
  showSearchBar?: boolean;
  searchPlaceholder?: string;
  mediaType?: 'image' | 'rive';
  riveFileUrl?: string;
}

const searchClient = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
);

export default function HeroSearchSection({
  tagLine,
  title,
  body,
  image,
  showSearchBar = true,
  searchPlaceholder,
  mediaType = 'image',
  riveFileUrl,
}: HeroSearchSectionProps) {
  const imageUrl = image?.asset?._id ? urlFor(image).url() : null;

  return (
    <div className="container bg-dark-shade py-20 lg:pt-32">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div>
          {tagLine && (
            <p className="font-secondary text-light-shade text-base font-semibold animate-fade-up [animation-delay:100ms] opacity-0 uppercase tracking-wide">
              {tagLine}
            </p>
          )}

          {title && (
            <h1 className="mt-4 text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-fade-up [animation-delay:200ms] opacity-0">
              {title}
            </h1>
          )}

          {body && (
            <div className="text-lg mt-6 animate-fade-up [animation-delay:300ms] opacity-0">
              <PortableTextRenderer value={body} />
            </div>
          )}

          {showSearchBar && (
            <div className="mt-10 animate-fade-up [animation-delay:400ms] opacity-0">
              <InstantSearch searchClient={searchClient} indexName="doctors_index">
                <DoctorSearchBar placeholder={searchPlaceholder} />
              </InstantSearch>
            </div>
          )}
        </div>

        <div className="flex justify-center animate-fade-up [animation-delay:500ms] opacity-0">
          {mediaType === 'image' && imageUrl && (
            <Image
              className="rounded-xl"
              src={imageUrl}
              alt={image?.alt || ''}
              width={image?.asset?.metadata?.dimensions?.width || 800}
              height={image?.asset?.metadata?.dimensions?.height || 800}
              placeholder={image?.asset?.metadata?.lqip ? 'blur' : undefined}
              blurDataURL={image?.asset?.metadata?.lqip || ''}
              quality={100}
            />
          )}

          {mediaType === 'rive' && riveFileUrl && (
            <iframe
              src={riveFileUrl}
              title="Rive Animation"
              className="w-full max-w-md h-[300px] rounded-lg shadow-md"
              allowFullScreen
            />
          )}
        </div>
      </div>
    </div>
  );
}