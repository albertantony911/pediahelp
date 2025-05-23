'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { urlFor } from '@/sanity/lib/image';
import { Theme, ThemeVariant } from '@/components/ui/theme/Theme';
import { Title, Subtitle, Content } from '@/components/ui/theme/typography';
import PortableTextRenderer from '@/components/portable-text-renderer';
import type { PortableTextBlock } from 'sanity';

// === Types ===

type SpecialtyCardItem = {
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
};

type SpecialtyCardSet = {
  cards: SpecialtyCardItem[];
};

export interface SpecialtyCardProps {
  _type: 'specialty-card';
  _key: string;
  theme?: ThemeVariant | null;
  tagLine?: string | null;
  title?: string | null;
  body?: PortableTextBlock[] | null;
  cardsSet?: SpecialtyCardSet | null;
}

// === Component ===

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

  const getHref = (card: SpecialtyCardItem): string => {
    if (card.link?.linkType === 'internal') {
      const slug = card.link.internalLink?.slug?.current;
      return card.link.internalLink?._type === 'specialities'
        ? `/specialities/${slug}`
        : `/${slug}`;
    }
    return card.link?.externalUrl || '#';
  };

  const renderCardImage = (card: SpecialtyCardItem) => {
    const lqip = card.image?.asset?.metadata?.lqip || '';
    return (
      <div className="flex flex-col rounded-4xl items-center w-full overflow-hidden aspect-square">
        <Image
          src={card.image ? urlFor(card.image).url() : ''}
          alt={card.image?.alt || ''}
          width={300}
          height={300}
          placeholder={lqip ? 'blur' : undefined}
          blurDataURL={lqip}
          quality={100}
          className={`w-full h-full object-cover rounded-4xl transition-transform duration-300 ease-out ${
            card.link?.hasLink ? 'group-hover:scale-105 group-hover:-translate-y-[2px]' : ''
          }`}
        />
      </div>
    );
  };

  const renderCard = (card: SpecialtyCardItem) => {
    if (!card.image?.asset?._id) return null;

    const isInternal =
      card.link?.hasLink &&
      card.link.linkType === 'internal' &&
      !!card.link.internalLink?.slug?.current;

    const hasLink = card.link?.hasLink === true;
    const href = getHref(card);

    const baseProps = {
      className: `group block w-full max-w-[150px] sm:max-w-[170px] rounded-4xl shadow-md transition-all duration-300 focus:outline-none ${
        hasLink
          ? 'focus:ring-2 focus:ring-dark-shade focus:ring-offset-2 hover:shadow-lg hover:scale-[1.02]'
          : ''
      } ${isTouched[card._key] ? 'scale-95 shadow-xl brightness-105' : ''}`,
      'aria-label': card.name || 'Specialty card',
      onTouchStart: () => handleTouchStart(card._key),
      onTouchEnd: () => handleTouchEnd(card._key),
    };

    const image = renderCardImage(card);

    if (!hasLink) {
      return (
        <div key={card._key} {...baseProps}>
          {image}
        </div>
      );
    }

    const linkProps = isInternal
      ? {}
      : {
          target: '_blank',
          rel: 'noopener noreferrer',
        };

    return isInternal ? (
      <Link key={card._key} href={href} {...baseProps}>
        {image}
      </Link>
    ) : (
      <a key={card._key} href={href} {...linkProps} {...baseProps}>
        {image}
      </a>
    );
  };

  return (
    <div className="w-full">
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

      {cards.length > 0 && (
        <Theme variant={theme || 'white'} disableContainer className="!text-inherit">
          <div className="flex flex-wrap justify-center lg:gap-16 gap-5 px-8 pb-10 max-w-[1150px] mx-auto">
            {cards.map(renderCard)}
          </div>
        </Theme>
      )}
    </div>
  );
}