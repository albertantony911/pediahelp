'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import PortableTextRenderer from '@/components/portable-text-renderer';
import { PAGE_QUERYResult } from '@/sanity.types';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch } from 'react-instantsearch';
import DoctorSearch from '@/components/blocks/doctor/DoctorSearch';
import { DoctorSearchDrawer } from '@/components/blocks/doctor/DoctorSearchDrawer';

type Hero1Props = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>['blocks']>[number],
  { _type: 'hero-1' }
>;

export default function Hero1({ tagLine, title, body, image }: Hero1Props) {
  const searchClient = useMemo(
    () =>
      algoliasearch(
        process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
        process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!
      ),
    []
  );

  return (
    <div className="container bg-dark-shade text-white py-20 lg:pt-40">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="flex flex-col justify-center">
          {tagLine && (
            <h1 className="leading-[0] font-secondary animate-fade-up [animation-delay:100ms] opacity-0">
              <span className="text-base font-semibold">{tagLine}</span>
            </h1>
          )}
          {title && (
            <h2 className="mt-6 font-bold leading-[1.1] text-4xl md:text-5xl lg:text-6xl animate-fade-up [animation-delay:200ms] opacity-0">
              {title}
            </h2>
          )}
          {body && (
            <div className="text-lg mt-6 animate-fade-up [animation-delay:300ms] opacity-0">
              <PortableTextRenderer value={body} />
            </div>
          )}
          <div className="mt-8 animate-fade-up [animation-delay:400ms] opacity-0">
            <InstantSearch
              searchClient={searchClient}
              indexName={process.env.NEXT_PUBLIC_ALGOLIA_DOCTORS_INDEX!}
            >
              <DoctorSearchDrawer /> {/* We'll handle fetching better soon */}
            </InstantSearch>
          </div>
         
        </div>
        <div className="flex flex-col justify-center">
          {image && image.asset?._id && (
            <Image
              className="rounded-xl animate-fade-up [animation-delay:500ms] opacity-0"
              src={urlFor(image).url()}
              alt={image.alt || ''}
              width={image.asset?.metadata?.dimensions?.width || 800}
              height={image.asset?.metadata?.dimensions?.height || 800}
              placeholder={image?.asset?.metadata?.lqip ? 'blur' : undefined}
              blurDataURL={image?.asset?.metadata?.lqip || ''}
              quality={100}
            />
          )}
        </div>
      </div>
    </div>
  );
}