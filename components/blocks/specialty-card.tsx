import { Theme } from "@/components/ui/theme/Theme";
import { Title, Subtitle, Content } from "@/components/ui/theme/typography";
import PortableTextRenderer from "@/components/portable-text-renderer";
import SpecialtyCardItem from "./specialty-card-item";

interface SpecialtyCardProps {
  theme?: "dark-shade" | "mid-shade" | "light-shade" | "white" | null;
  tagLine?: string | null;
  title?: string | null;
  body?: any[] | null; // Adjust based on your PortableTextRenderer type
  cards?: Array<{
    name?: string | null;
    image?: {
      asset?: {
        _id: string;
        url: string;
        mimeType: string;
        metadata?: {
          lqip?: string;
          dimensions?: {
            width: number;
            height: number;
          };
        };
      };
      alt?: string | null;
    } | null;
    alt?: string | null;
    link?: string | null;
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, index) => (
              <SpecialtyCardItem {...card} key={card._key || index} />
            ))}
          </div>
        )}
      </div>
    </Theme>
  );
}