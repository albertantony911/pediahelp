import { Theme } from "@/components/ui/theme/Theme";
import { Title, Subtitle, Content } from "@/components/ui/theme/typography";
import PortableTextRenderer from "@/components/portable-text-renderer";
import SpecialtyCardItem from "./specialty-card-item";
import Link from 'next/link';

interface SpecialtyCardProps {
  _type: "specialty-card";
  _key: string;
  theme?: "dark-shade" | "mid-shade" | "light-shade" | "white" | null;
  tagLine?: string | null;
  title?: string | null;
  body?: any[] | null;
  cards?: Array<{
    name?: string | null;
    image?: {
      asset?: {
        _id: string;
        url: string | null;
        mimeType: string | null;
        metadata?: {
          lqip?: string | null;
          dimensions?: { width: number; height: number } | null;
        } | null;
      } | null;
      alt?: string | null;
      _type: "image";
    } | null;
    link?: {
      internalLink?: { slug?: { current: string | null } | null } | null;
      externalUrl?: string | null;
    } | null;
    _key?: string;
  }> | null;
}

export default function SpecialtyCard({ theme, tagLine, title, body, cards }: SpecialtyCardProps) {
  return (
    <Theme variant={theme || "white"}>
      <div className="flex flex-col gap-8 py-20 lg:pt-40">
        {/* Section Header */}
        <div className="w-full mx-auto md:text-center">
          {tagLine && <Subtitle>{tagLine}</Subtitle>}
          {title && <Title>{title}</Title>}
          {body && (
            <Content as="div">
              <PortableTextRenderer value={body} />
            </Content>
          )}
        </div>

        {/* Grid */}
        {cards && cards.length > 0 && (
          <div className="w-full mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 justify-items-center">
              {cards.map((card, index) => {
                // Determine the href and whether it's internal
                const href = card.link?.internalLink?.slug?.current
                  ? `/${card.link.internalLink.slug.current}`
                  : card.link?.externalUrl || null;
                const isInternal = !!card.link?.internalLink?.slug?.current;

                // If there's no link, render the card without a wrapper
                if (!href) {
                  return (
                    <div
                      key={card._key || index}
                      className="w-full max-w-[300px] transition-transform duration-300 hover:scale-105"
                    >
                      <SpecialtyCardItem {...card} />
                    </div>
                  );
                }

                // Render the card with a Link or <a> tag based on the link type
                return (
                  <div
                    key={card._key || index}
                    className="w-full max-w-[300px] transition-transform duration-300 hover:scale-105"
                  >
                    {isInternal ? (
                      <Link href={href}>
                        <SpecialtyCardItem {...card} />
                      </Link>
                    ) : (
                      <a href={href} target="_blank" rel="noopener noreferrer">
                        <SpecialtyCardItem {...card} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Theme>
  );
}