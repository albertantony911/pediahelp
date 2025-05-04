import { Button, buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import PortableTextRenderer from "@/components/portable-text-renderer";
import { PAGE_QUERYResult } from "@/sanity.types";
import { VariantProps } from 'class-variance-authority';

// Theme & Typography
import { Theme, ThemeVariant } from '@/components/ui/theme/Theme'
import { Title, Subtitle, Content } from '@/components/ui/theme/typography'

type Hero2Props = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
  { _type: "hero-2" }
>;

export default function Hero2({ theme, tagLine, title, body, buttons }: Hero2Props) {
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
        {buttons && buttons.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            {buttons.map((button, index) => {
              // Determine the href and whether it's internal
              const href = button?.link?.internalLink?.slug?.current
                ? `/${button.link.internalLink.slug.current}`
                : button?.link?.externalUrl || null;
              const isInternal = !!button?.link?.internalLink?.slug?.current;

              return (
                button?.buttonLabel && href && (
                  <div
                    key={index}
                    className="animate-fade-up [animation-delay:400ms] opacity-0"
                  >
                    {isInternal ? (
                      <Button asChild variant={button.buttonVariant ?? "secondary"}>
                        <Link href={href}>{button.buttonLabel}</Link>
                      </Button>
                    ) : (
                      <Button variant={button.buttonVariant ?? "secondary"} href={href}>
                        {button.buttonLabel}
                      </Button>
                    )}
                  </div>
                )
              );
            })}
          </div>
        )}
      </div>
    </Theme>
  );
}