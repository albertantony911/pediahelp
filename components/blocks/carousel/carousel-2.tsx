'use client';

import { useEffect, useState } from 'react';
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
  theme,
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
      align: 'center',
      dragFree: true,
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
        groq`*[_type == "doctor"] | order(orderRank asc)[0...5] {
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

  // 🔁 Virtual duplication to ensure smooth infinite scroll
  const visibleDoctors = doctors.length < 6
    ? [...doctors, ...doctors, ...doctors]
    : doctors;

  if (doctors.length === 0) return null;

  return (
    <div className="w-full">
      {/* Header Section */}
      <Theme variant={theme || 'dark-shade'}>
        <div className="pt-10 pb-10 w-full mx-auto md:text-center " id="team">
          {tagLine && <Subtitle>{tagLine}</Subtitle>}
          {title && <Title>{title}</Title>}
          {body && (
            <Content as="div">
              <PortableTextRenderer value={body} />
            </Content>
          )}
          {buttonText && buttonLink && (
            <div className="mt-4">
              <Button asChild variant="secondary">
                <Link href={buttonLink}>{buttonText}</Link>
              </Button>
            </div>
          )}
        </div>
      </Theme>

{/* Carousel Section */}
<Theme variant={theme || 'dark-shade'} disableContainer className="!text-inherit">
  {/* Wrap only the carousel area in a relative container */}
  <div className="relative max-w-[1400px] mx-auto">
    {/* Smooth Left Fade */}
    <div className="pointer-events-none absolute left-0 top-0 h-full lg:w-64 w-28 z-10 bg-gradient-to-r from-[#264E53] to-transparent" />
    {/* Smooth Right Fade */}
    <div className="pointer-events-none absolute right-0 top-0 h-full lg:w-64 w-28 z-10 bg-gradient-to-l from-[#264E53]  to-transparent" />

    <div ref={emblaRef} className="overflow-hidden px-4 pb-10">
      <div className="flex gap-5">
        {visibleDoctors.map((doc, i) => (
          <div
            key={`${doc._id}-${i}`}
            className="basis-[210px] flex-shrink-0 first:ml-4"
          >
            <Card className="h-full shadow-md rounded-4xl bg-white transition-all duration-300 border border-transparent hover:border-light-shade">
              <CardContent className="p-4 flex flex-col items-center gap-1">
                {/* Image */}
                <div className="w-full h-36 sm:h-36 rounded-lg overflow-hidden bg-muted">
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

                {/* Name & Specialty */}
                <div className="text-center mt-2">
                  <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                    {doc.name}
                  </h3>
                  <p className="text-xs text-gray-500">{doc.specialty}</p>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs px-3 py-1"
                    asChild
                  >
                    <Link href={`/consultation/${doc.slug.current}`}>Profile</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="text-xs px-3 py-1"
                    asChild
                  >
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
</Theme>
    </div>
  );
}