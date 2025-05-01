'use client';

import { useEffect, useState } from 'react';
import { urlFor } from '@/sanity/lib/image';
import { client } from '@/sanity/lib/client';
import { groq } from 'next-sanity';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
} from '@/components/ui/carousel';

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import { FaWhatsapp } from 'react-icons/fa';
import { User } from 'lucide-react';
import Link from 'next/link';

import type { Doctor } from '@/types';

export default function DoctorTeamCarousel() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    async function fetchDoctors() {
      const data = await client.fetch<Doctor[]>(
        groq`*[_type == "doctor"] | order(orderRank asc)[0...7] {
          _id,
          name,
          specialty,
          photo { asset->{url} },
          slug,
          whatsappNumber
        }`
      );
      setDoctors(data);
    }

    fetchDoctors();
  }, []);

  if (!doctors.length) return null;

  return (
    <div className="w-full py-8">
      <Carousel>
        <CarouselContent>
          {doctors.map((doc) => (
            <CarouselItem
              key={doc._id}
              className="pl-2 md:pl-4 md:basis-1/3 lg:basis-1/4"
            >
              <Card className="h-full shadow-md rounded-xl">
                <CardContent className="p-4 flex flex-col items-center gap-3">
                  <Avatar className="w-16 h-16">
                    {doc.photo?.asset?.url ? (
                      <AvatarImage
                        src={urlFor(doc.photo).url()}
                        alt={doc.name}
                      />
                    ) : (
                      <User className="text-gray-400" />
                    )}
                    <AvatarFallback>
                      {doc.name?.slice(0, 2) || 'Dr'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="text-center">
                    <h3 className="font-semibold text-sm">{doc.name}</h3>
                    <p className="text-xs text-muted-foreground">{doc.specialty}</p>
                  </div>

                  <div className="flex gap-2 mt-2 flex-wrap justify-center">
                    {doc.whatsappNumber && /^\+91\d{10}$/.test(doc.whatsappNumber) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-1"
                        asChild
                      >
                        <a
                          href={`https://wa.me/${doc.whatsappNumber.replace('+', '')}?text=${encodeURIComponent(
                            `Hi, I’d like to consult with Dr. ${doc.name} via PediaHelp.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FaWhatsapp className="mr-1 w-4 h-4" />
                          Message
                        </a>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled
                        className="text-xs px-2 py-1"
                      >
                        Message
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs px-2 py-1"
                      asChild
                    >
                      <Link href={`/consultation/${doc.slug.current}`}>
                        Profile
                      </Link>
                    </Button>

                    <Button
                      size="sm"
                      className="text-xs px-3 py-1"
                      asChild
                    >
                      <Link href={`/consultation/${doc.slug.current}/booking`}>
                        Book
                      </Link>
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
    </div>
  );
}