'use client';

import Link from 'next/link';
import { createElement } from 'react';
import { cn } from '@/lib/utils';
import { stegaClean } from 'next-sanity';
import PortableTextRenderer from '@/components/portable-text-renderer';
import { Button } from '@/components/ui/button';

import { Theme } from '@/components/ui/theme/Theme';
import { Subtitle, Title, Content } from '@/components/ui/theme/typography';

import { PAGE_QUERYResult } from '@/sanity.types';

type Block = NonNullable<NonNullable<PAGE_QUERYResult>['blocks']>[number];
type SplitRow = Extract<Block, { _type: 'split-row' }>;
type SplitContent = Extract<
  NonNullable<SplitRow['splitColumns']>[number],
  { _type: 'split-content' }
>;

interface SplitContentProps extends SplitContent {
  noGap?: boolean;
}

export default function SplitContent({
  sticky,
  padding,
  noGap,
  tagLine,
  title,
  body,
  link,
}: SplitContentProps) {
  return (
    <Theme variant="dark-shade" >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 py-20 lg:pt-40">
        <div
          className={cn(
            'flex flex-col justify-center',
            sticky && 'lg:sticky lg:top-56',
            padding?.top && 'pt-16 xl:pt-20',
            padding?.bottom && 'pb-16 xl:pb-20',
            noGap && 'px-10'
          )}
        >
          {tagLine && <Subtitle>{tagLine}</Subtitle>}

          {title &&
            createElement(
              tagLine ? 'h3' : 'h2',
              {},
              <Title>{title}</Title>
            )}

          {body && (
            <Content as="div">
              <PortableTextRenderer value={body} />
            </Content>
          )}

          {link?.href && (
            <div className="mt-8 animate-fade-up [animation-delay:400ms] opacity-0">
              <Button
                
                asChild
              >
                <Link
                  href={link.href}
                  target={link.target ? '_blank' : undefined}
                >
                  {link.title}
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Right column intentionally blank for mirror structure */}
        <div className="flex flex-col justify-center"></div>
      </div>
    </Theme>
  );
}