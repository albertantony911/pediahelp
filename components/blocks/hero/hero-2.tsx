import { Button } from "@/components/ui/button";
import Link from "next/link";
import { stegaClean } from "next-sanity";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERYResult } from "@/sanity.types";

type Hero2Props = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
  { _type: "hero-2" }
  >;


  // Theme & Typography
import { Theme } from '@/components/ui/theme/Theme'
import { Title, Subtitle, Content } from '@/components/ui/theme/typography'

export default function Hero2({ tagLine, title, body, links }: Hero2Props) {
  return (

    <Theme variant="dark-shade">
      <div className=" dark:bg-background py-20 lg:pt-40 xl:text-center">
        {tagLine && <Subtitle>{tagLine}</Subtitle>}
            {title && <Title>{title}</Title>}
            {body && (
              <Content as="div">
                <PortableTextRenderer value={body} />
              </Content>
              
            )}
            <div className="mt-0 animate-fade-up [animation-delay:400ms] opacity-0">
              <Button href="/about" variant="secondary" >
                Our Story
              </Button>
            </div>

      </div>
    </Theme>
  );
}
