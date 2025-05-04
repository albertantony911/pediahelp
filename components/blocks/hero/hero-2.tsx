import { Button } from "@/components/ui/button";
import Link from "next/link";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERYResult } from "@/sanity.types";

// Theme & Typography
import { Theme, ThemeVariant } from '@/components/ui/theme/Theme'
import { Title, Subtitle, Content } from '@/components/ui/theme/typography'

type Hero2Props = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
  { _type: "hero-2" }
>;

export default function Hero2({ theme, tagLine, title, body, links }: Hero2Props) {
  return (
    <Theme variant={theme || "dark-shade"}>
      <div className="dark:bg-background py-20 lg:pt-40 xl:text-center">
        {tagLine && <Subtitle>{tagLine}</Subtitle>}
        {title && <Title>{title}</Title>}
        {body && (
          <Content as="div">
            <PortableTextRenderer value={body} />
          </Content>
        )}
        <div>
          <Button href="/about" variant="secondary">
            Our Story
          </Button>
        </div>
      </div>
    </Theme>
  );
}