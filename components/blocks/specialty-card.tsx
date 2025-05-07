'use client';

import { useState } from 'react';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import { Theme, ThemeVariant } from '@/components/ui/theme/Theme';
import { Title, Subtitle, Content } from '@/components/ui/theme/typography';
import PortableTextRenderer from '@/components/portable-text-renderer';

export interface SpecialtyCardProps {
  _type: 'specialty-card';
  _key: string;
  theme?: ThemeVariant | null;
  tagLine?: string | null;
  title?: string | null;
  body?: {
    children?: Array<{
      marks?: string[];
      text?: string;
      _type: 'span';
      _key: string;
    }>;
    _type: 'block';
    _key: string;
  }[] | null;
  cards?: Array<{
    _key: string;
    name?: string | null;
    image?: {
      alt?: string | null;
      asset?: {
        _id: string;
        url: string | null;
        mimeType: string | null;
        metadata?: {
          lqip?: string | null;
          dimensions?: {
            width: number | null;
            height: number | null;
          } | null;
        } | null;
      } | null;
    } | null;
    link?: {
      _type?: string | null;
      _key?: string | null;
      externalUrl?: string | null;
      internalLink?: {
        href?: string | null;
      } | null;
    } | null;
  }> | null;
}

export default function SpecialtyCard({
  theme,
  tagLine,
  title,
  body,
  cards,
}: SpecialtyCardProps) {
  const [isTouched, setIsTouched] = useState<Record<string, boolean>>({});

  const handleTouchStart = (key: string) => {
    setIsTouched((prev) => ({ ...prev, [key]: true }));
  };

  const handleTouchEnd = (key: string) => {
    setTimeout(() => {
      setIsTouched((prev) => ({ ...prev, [key]: false }));
    }, 100);
  };

  return (
    <Theme variant={theme || 'white'} disableContainer>
      <section className="py-8 px-4 w-full">
        <div className="max-w-[1100px] mx-auto text-center">
          {tagLine && <Subtitle>{tagLine}</Subtitle>}
          {title && <Title>{title}</Title>}
          {body && (
            <Content as="div" className="mb-10 max-w-3xl mx-auto">
              <PortableTextRenderer value={body} />
            </Content>
          )}

          {cards && cards.length > 0 && (
            <div className="flex flex-wrap justify-center lg:gap-16 gap-5 mt-6">
              {cards.map((card) => {
                const href = card.link?.externalUrl || card.link?.internalLink?.href || '#';
                if (!card.image?.asset?._id) return null;

                const lqip = card.image.asset.metadata?.lqip || '';

                return (
                  <a
                    key={card._key}
                    href={href}
                    className={`group block w-full max-w-[176px] sm:max-w-[200px] rounded-4xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 hover:shadow-lg hover:scale-[1.02] ${
                      isTouched[card._key] ? 'scale-95 shadow brightness-105' : ''
                    }`}
                    aria-label={card.name || 'Specialty card'}
                    onTouchStart={() => handleTouchStart(card._key)}
                    onTouchEnd={() => handleTouchEnd(card._key)}
                  >
                    <div className="flex flex-col rounded-4xl items-center w-full overflow-hidden aspect-square">
                      <Image
                        src={urlFor(card.image).url()}
                        alt={card.image.alt || ''}
                        width={300}
                        height={300}
                        placeholder={lqip ? 'blur' : undefined}
                        blurDataURL={lqip}
                        quality={100}
                        className="w-full h-full object-cover rounded-4xl transition-transform duration-300 ease-out group-hover:scale-105 group-hover:-translate-y-[2px]"
                      />
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Theme>
  );
}