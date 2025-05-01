'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { groq } from 'next-sanity';
import { urlFor } from '@/sanity/lib/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';

import { Title, Subtitle, Content } from '@/components/ui/theme/typography';
import { Theme } from '@/components/ui/theme/Theme';
import PortableTextRenderer from '@/components/portable-text-renderer';

import Autoplay from 'embla-carousel-autoplay';

import type { Doctor } from '@/types';
import type { PAGE_QUERYResult } from '@/sanity.types';
import { client } from '@/sanity/lib/client';

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
      .catch((err: unknown) => console.error('Doctor fetch failed:', err));
  }, []);

  if (doctors.length === 0) return null;

  return (
    <div className="flex flex-col gap-8 py-16 lg:pt-24 bg-dark-shade w-full">
      {/* Header Content */}
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
      <div className="w-full mx-auto">
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
                className="basis-1/2 pl-3 sm:pl-4 md:pl-5 md:basis-1/3 lg:basis-[22%] xl:basis-[18%]"
              >
                <Card className="h-full shadow-md rounded-xl bg-white transition-transform hover:-translate-y-1 hover:shadow-lg border-none">
                  <CardContent className="p-4 flex flex-col items-center gap-3">
                    <div className="w-full h-36 sm:h-40 rounded-lg overflow-hidden bg-muted">
                      {doc.photo?.asset?.url ? (
                        <img
                          src={urlFor(doc.photo).width(300).height(320).url()}
                          alt={doc.name}
                          className="object-cover w-full h-full"
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
                        variant="secondary"
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
        </Carousel>
      </div>
    </div>
  );
}