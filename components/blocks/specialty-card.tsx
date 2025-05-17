'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
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
  cardsSet?: {
    cards: Array<{
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
        hasLink?: boolean | null;
        linkType?: 'internal' | 'external' | null;
        internalLink?: {
          _type?: 'page' | 'specialities' | null;
          slug?: {
            current?: string | null;
          } | null;
        } | null;
        externalUrl?: string | null;
      } | null;
    }>;
  } | null;
}

export default function SpecialtyCard({
  theme,
  tagLine,
  title,
  body,
  cardsSet,
}: SpecialtyCardProps) {
  const cards = cardsSet?.cards || [];
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
    <div className="w-full">
      {/* Header Section */}
      <Theme variant={theme || 'white'}>
        <div className="max-w-[1100px] mx-auto py-10 lg:text-center">
          {tagLine && <Subtitle>{tagLine}</Subtitle>}
          {title && <Title>{title}</Title>}
          {body && (
            <Content as="div">
              <PortableTextRenderer value={body} />
            </Content>
          )}
        </div>
      </Theme>

      {/* Card Section */}
      {cards.length > 0 && (
        <Theme variant={theme || 'white'} disableContainer className="!text-inherit">
          <div className="flex flex-wrap justify-center lg:gap-16 gap-5 px-8 pb-10 max-w-[1150px] mx-auto">
            {cards.map((card) => {
              if (!card.image?.asset?._id) return null;

              const lqip = card.image.asset.metadata?.lqip || '';
              const hasLink = card.link?.hasLink === true;
              const isInternal =
                hasLink &&
                card.link?.linkType === 'internal' &&
                card.link?.internalLink?.slug?.current;

              const commonProps = {
                key: card._key,
                className: `group block w-full max-w-[150px] sm:max-w-[170px] rounded-4xl shadow-md transition-all duration-300 focus:outline-none ${
                  hasLink
                    ? 'focus:ring-2 focus:ring-dark-shade focus:ring-offset-2 hover:shadow-lg hover:scale-[1.02]'
                    : ''
                } ${isTouched[card._key] ? 'scale-95 shadow-xl brightness-105' : ''}`,
                'aria-label': card.name || 'Specialty card',
                onTouchStart: () => handleTouchStart(card._key),
                onTouchEnd: () => handleTouchEnd(card._key),
              };

              const image = (
                <div className="flex flex-col rounded-4xl items-center w-full overflow-hidden aspect-square">
                  <Image
                    src={urlFor(card.image).url()}
                    alt={card.image.alt || ''}
                    width={300}
                    height={300}
                    placeholder={lqip ? 'blur' : undefined}
                    blurDataURL={lqip}
                    quality={100}
                    className={`w-full h-full object-cover rounded-4xl transition-transform duration-300 ease-out ${
                      hasLink ? 'group-hover:scale-105 group-hover:-translate-y-[2px]' : ''
                    }`}
                  />
                </div>
              );

              if (!hasLink) {
                return <div {...commonProps}>{image}</div>;
              }

              const href = isInternal
                ? card.link?.internalLink?._type === 'specialities'
                  ? `/specialities/${card.link?.internalLink?.slug?.current}`
                  : `/${card.link?.internalLink?.slug?.current}`
                : card.link?.externalUrl || '#';

              const linkProps = {
                href,
                ...(isInternal
                  ? {}
                  : {
                      target: '_blank',
                      rel: 'noopener noreferrer',
                    }),
              };

              return isInternal ? (
                <Link {...commonProps} {...linkProps}>
                  {image}
                </Link>
              ) : (
                <a {...commonProps} {...linkProps}>
                  {image}
                </a>
              );
            })}
          </div>
        </Theme>
      )}
    </div>
  );
}
