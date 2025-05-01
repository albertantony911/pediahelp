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
  CarouselDots,
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
    <div className="flex flex-col  gap-10 py-20 lg:pt-32 bg-dark-shade w-full ">
      {/* Left - Themed Content */}
      <Theme variant="dark-shade" >
        <div className="w-full mx-auto lg:mx-0 text-center  ">
          {tagLine && <Subtitle>{tagLine}</Subtitle>}
          {title && <Title>{title}</Title>}
          {body && (
            <Content as="div" >
              <PortableTextRenderer value={body} />
            </Content>
          )}

          {buttonText && buttonLink && (
            <div className="mt-8 animate-fade-up [animation-delay:400ms] opacity-0">
              <Button asChild variant="secondary">
                <Link href={buttonLink}>{buttonText}</Link>
              </Button>
            </div>
          )}
        </div>
      </Theme>

      {/* Right - Carousel Outside Theme */}
      <div className=" w-full  mx-auto ">
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
                <Card className="h-full shadow-sm rounded-xl transition-transform hover:-translate-y-1 hover:shadow-md">
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

          <div className="w-full flex justify-center mt-4">
            <CarouselDots className="gap-2 [&>button]:w-2.5 [&>button]:h-2.5 [&>button]:bg-muted-foreground [&>button[aria-current='true']]:bg-primary rounded-full" />
          </div>
        </Carousel>
      </div>
    </div>
  );
}