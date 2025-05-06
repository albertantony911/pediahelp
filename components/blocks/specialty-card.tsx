'use client';

import { Theme, ThemeVariant } from '@/components/ui/theme/Theme';
import { PortableText } from '@portabletext/react';
import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';
import { useState } from 'react';

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
  // State to manage touch active state for mobile
  const [isTouched, setIsTouched] = useState<Record<string, boolean>>({});

  // Calculate grid layout based on card count
  const getGridStyles = (cardCount: number) => {
    if (cardCount <= 4) {
      return `grid grid-cols-1 sm:grid-cols-${cardCount} gap-4 justify-items-center`;
    } else {
      const rows = Math.ceil(cardCount / 4);
      const lastRowCount = cardCount % 4 || 4;
      return `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 justify-items-center auto-rows-fr ${
        lastRowCount < 4 ? `last-row-col-${lastRowCount}` : ''
      }`;
    }
  };

  // Handle touch start for mobile
  const handleTouchStart = (key: string) => {
    setIsTouched((prev) => ({ ...prev, [key]: true }));
  };

  // Handle touch end with a delay for animation
  const handleTouchEnd = (key: string) => {
    setTimeout(() => {
      setIsTouched((prev) => ({ ...prev, [key]: false }));
    }, 100); // 100ms delay to show the pressed state
  };

  return (
    <Theme variant={theme || 'white'}>
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          {tagLine && (
            <p className="text-sm text-muted-foreground mb-2 tracking-wide uppercase">
              {tagLine}
            </p>
          )}
          {title && (
            <h2 className="text-3xl md:text-4xl font-semibold mb-6">
              {title}
            </h2>
          )}
          {body && (
            <div className="prose prose-lg mx-auto mb-8 max-w-3xl">
              <PortableText value={body} />
            </div>
          )}
          {cards && cards.length > 0 && (
            <div className={getGridStyles(cards.length)}>
              {cards.map((card, index) => {
                const href = card.link?.externalUrl || card.link?.internalLink?.href || '#';
                const cardsPerRow = cards.length <= 4 ? cards.length : 4;
                const isLastRow = Math.floor(index / cardsPerRow) === Math.ceil(cards.length / cardsPerRow) - 1;
                const lastRowCount = cards.length % 4 || 4;

                if (!card.image?.asset?._id) return null;

                const lqip = card.image.asset.metadata?.lqip || '';

                return (
                  <a
                    key={card._key}
                    href={href}
                    className={`block w-full max-w-44 rounded-4xl transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 active:shadow active:brightness-105 ${
                      isTouched[card._key] ? 'scale-95 shadow brightness-105' : ''
                    } ${
                      isLastRow && lastRowCount < 4 ? `last-row-item col-span-1 sm:col-span-1 md:col-span-1` : ''
                    }`}
                    aria-label={card.name || 'Specialty card'}
                    onTouchStart={() => handleTouchStart(card._key)}
                    onTouchEnd={() => handleTouchEnd(card._key)}
                  >
                    {card.name && (
                      <h3 className="sr-only">{card.name}</h3>
                    )}
                    <div className="flex flex-col rounded-4xl items-center w-full overflow-hidden aspect-square">
                      <Image
                        src={urlFor(card.image).url()}
                        alt={card.image.alt || ''}
                        width={300}
                        height={300}
                        placeholder={lqip ? 'blur' : undefined}
                        blurDataURL={lqip}
                        quality={100}
                        className="w-full h-full object-cover rounded-4xl"
                      />
                      {card.name && (
                        <p className="sr-only mt-2 text-center text-sm font-medium px-2 pb-2">
                          {card.name}
                        </p>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </section>
      <style jsx>{`
        .last-row-col-1 .last-row-item {
          grid-column: 2 / 3;
        }
        .last-row-col-2 .last-row-item {
          grid-column: auto;
        }
        .last-row-col-3 .last-row-item {
          grid-column: auto;
        }
        @media (max-width: 768px) {
          .last-row-col-1 .last-row-item,
          .last-row-col-2 .last-row-item,
          .last-row-col-3 .last-row-item {
            grid-column: 1 / -1;
          }
        }
      `}</style>
    </Theme>
  );
}