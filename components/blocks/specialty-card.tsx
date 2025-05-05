import { Theme } from "@/components/ui/theme/Theme";
import { Title, Subtitle, Content } from "@/components/ui/theme/typography";
import PortableTextRenderer from "@/components/portable-text-renderer";
import SpecialtyCardItem from "./specialty-card-item";

interface SpecialtyCardProps {
  _type: "specialty-card";
  _key: string;
  theme?: "dark-shade" | "mid-shade" | "light-shade" | "white" | null;
  tagLine?: string | null;
  title?: string | null;
  body?: any[] | null; // Type as any[] | null to allow any PortableText content
  cards?: Array<{
    name?: string | null;
    image?: {
      asset?: {
        _id: string;
        url: string | null;
        mimeType: string | null;
        metadata?: {
          lqip?: string | null;
          dimensions?: { width: number | null; height: number | null } | null;
        } | null;
      } | null;
      alt?: string | null;
      _type: "image";
    } | null;
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