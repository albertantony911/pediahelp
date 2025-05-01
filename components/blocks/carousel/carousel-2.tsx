'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { groq } from 'next-sanity';
import { User } from 'lucide-react';

import { client } from '@/sanity/lib/client';
import { urlFor } from '@/sanity/lib/image';

import SectionContainer from '@/components/ui/section-container';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
} from '@/components/ui/carousel';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Title, Subtitle, Content } from '@/components/ui/theme/typography';
import PortableTextRenderer from '@/components/portable-text-renderer';
import type { PAGE_QUERYResult } from '@/sanity.types';
import type { Doctor } from '@/types';

import Autoplay from 'embla-carousel-autoplay';

type Carousel2Props = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>['blocks']>[number],
  { _type: 'carousel-2' }
>;

export default function Carousel2({
  padding,
  colorVariant,
  tagLine,
  title,
  body,
  buttonText,
  buttonLink,
}: Carousel2Props) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    client
      .fetch<Doctor[]>(
        groq`*[_type == "doctor"] | order(orderRank asc)[0...7] {
          _id,
          name,
          specialty,
          photo { asset->{url} },
          slug,
          whatsappNumber
        }`
      )
      .then(setDoctors)
      .catch((err) => console.error('Doctor fetch failed:', err));
  }, []);

  const hasHeading = tagLine || title || body || (buttonText && buttonLink);
  if (doctors.length === 0) return null;

  return (
    <SectionContainer color={colorVariant ?? null} padding={padding}>
      {hasHeading && (
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
          {tagLine && <Subtitle>{tagLine}</Subtitle>}
          {title && <Title>{title}</Title>}
          {body && (
            <Content as="div" className="mt-2 text-muted-foreground">
              <PortableTextRenderer value={body} />
            </Content>
          )}
          {buttonText && buttonLink && (
            <div className="mt-6">
              <Button asChild>
                <Link href={buttonLink}>{buttonText}</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      <Carousel
        plugins={[
          Autoplay({
            delay: 3000,
            stopOnInteraction: false,
          }),
        ]}
        opts={{ loop: true }}
      >
        <CarouselContent>
          {doctors.map((doc) => (
            <CarouselItem
              key={doc._id}
              className="basis-1/2 pl-2 sm:pl-2 md:pl-4 md:basis-1/3 lg:basis-1/5 xl:basis-[18%]"
            >
              <Card className="h-full shadow-sm rounded-xl">
                <CardContent className="p-3 sm:p-4 flex flex-col items-center gap-2 sm:gap-3">
                  <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-lg overflow-hidden bg-muted">
                    {doc.photo?.asset?.url ? (
                      <img
                        src={urlFor(doc.photo).width(200).height(240).url()}
                        alt={doc.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-muted-foreground text-sm font-semibold">
                        {doc.name?.slice(0, 2) || 'Dr'}
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <h3 className="font-semibold text-xs sm:text-sm">{doc.name}</h3>
                    <p className="text-[11px] sm:text-xs text-muted-foreground">{doc.specialty}</p>
                  </div>

                  <div className="flex gap-2 mt-2 flex-wrap justify-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs px-3 py-1"
                      asChild
                    >
                      <Link href={`/consultation/${doc.slug.current}`}>Profile</Link>
                    </Button>

                    <Button
                      size="sm"
                      className="text-xs px-3 py-1"
                      asChild
                    >
                      <Link href={`/consultation/${doc.slug.current}/booking`}>Book</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious variant="secondary" className="-left-3 md:-left-6" />
        <CarouselNext variant="secondary" className="-right-3 md:-right-6" />
        <div className="w-full flex justify-center mt-3">
          <CarouselDots />
        </div>
      </Carousel>
    </SectionContainer>
  );
}