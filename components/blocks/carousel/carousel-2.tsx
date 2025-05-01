'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { groq } from 'next-sanity';
import { urlFor } from '@/sanity/lib/image';
import { client } from '@/sanity/lib/client';

import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Title, Subtitle, Content } from '@/components/ui/theme/typography';
import { Theme } from '@/components/ui/theme/Theme';
import PortableTextRenderer from '@/components/portable-text-renderer';

import type { Doctor } from '@/types';
import type { PAGE_QUERYResult } from '@/sanity.types';

type Carousel2Props = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>['blocks']>[number],
  { _type: 'carousel-2' }
>;

export default function Carousel2({
  tagLine,
  title,
  body,
  buttonText,
  buttonLink,
}: Carousel2Props) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [emblaRef] = useEmblaCarousel(
    {
      loop: true,
      dragFree: true,
      align: 'start',
      slidesToScroll: 1,
    },
    [
      Autoplay({
        delay: 3000,
        stopOnInteraction: false,
      }),
    ]
  );

  useEffect(() => {
    client
      .fetch<Doctor[]>(
        groq`*[_type == "doctor"] | order(orderRank asc)[0...7] {
          _id,
          name,
          specialty,
          photo { asset->{url} },
          slug
        }`
      )
      .then(setDoctors)
      .catch((err) => console.error('Doctor fetch failed:', err));
  }, []);

  if (doctors.length === 0) return null;

  return (
    <div className="flex flex-col gap-8 py-16 lg:pt-24 bg-dark-shade w-full">
      {/* Section Header */}
      <Theme variant="dark-shade">
        <div className="w-full mx-auto md:text-center px-4">
          {tagLine && <Subtitle>{tagLine}</Subtitle>}
          {title && <Title>{title}</Title>}
          {body && (
            <Content as="div">
              <PortableTextRenderer value={body} />
            </Content>
          )}
          {buttonText && buttonLink && (
            <div>
              <Button asChild variant="secondary">
                <Link href={buttonLink}>{buttonText}</Link>
              </Button>
            </div>
          )}
        </div>
      </Theme>

      {/* Carousel */}
      <div className="w-full mx-auto max-w-[640px] sm:max-w-[768px] md:max-w-[1024px] lg:max-w-[1280px] xl:max-w-[1440px] overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {doctors.map((doc) => (
<div
  key={doc._id}
  className="flex-[0_0_50%] sm:flex-[0_0_33.33%] md:flex-[0_0_25%] lg:flex-[0_0_22%] xl:flex-[0_0_18%] pl-3 sm:pl-4 md:pl-5 max-w-[240px]"
>
              <Card className="h-full shadow-md rounded-xl bg-white transition-all duration-300 border border-transparent hover:border-blue-500 hover:shadow-blue-500/50 hover:shadow-lg">
                <CardContent className="p-4 flex flex-col items-center gap-3">
                  <div className="w-full h-36 sm:h-40 rounded-lg overflow-hidden bg-muted">
                    {doc.photo?.asset?.url ? (
                      <img
                        src={urlFor(doc.photo).width(300).height(320).url()}
                        alt={doc.name}
                        className="object-cover w-full h-full transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-muted-foreground text-lg font-semibold">
                        {doc.name?.slice(0, 2) || 'Dr'}
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <h3 className="font-semibold text-sm sm:text-base text-gray-900">{doc.name}</h3>
                    <p className="text-xs text-gray-500">{doc.specialty}</p>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" className="text-xs px-3 py-1" asChild>
                      <Link href={`/consultation/${doc.slug.current}`}>Profile</Link>
                    </Button>
                    <Button size="sm" variant="secondary" className="text-xs px-3 py-1" asChild>
                      <Link href={`/consultation/${doc.slug.current}/booking`}>Book</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}