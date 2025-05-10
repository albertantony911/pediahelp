'use client'

import Link from 'next/link'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import PortableTextRenderer from '@/components/portable-text-renderer'
import { PAGE_QUERYResult } from '@/sanity.types'
import { DoctorSearchDrawer } from '@/components/blocks/doctor/DoctorSearchDrawer'
import { Button } from '@/components/ui/button';
import { Theme } from '@/components/ui/theme/Theme'
import { Title, Subtitle, Content } from '@/components/ui/theme/typography'

type LayoutOption = 'image-left' | 'image-right' | null

type Hero1Props = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>['blocks']>[number],
  { _type: 'hero-1' }
>

const Hero1: React.FC<Hero1Props> = ({
  theme,
  layout = 'image-right',
  reverseOnMobile = false,
  tagLine,
  title,
  body,
  image,
  showButton,
  buttonType,
  customButton,
}) => {
  // Desktop layout: true if image is on the left
  const isImageLeftDesktop = layout === 'image-left';

  // Mobile layout: reverse the desktop layout if reverseOnMobile is true
  const isImageLeftMobile = reverseOnMobile ? !isImageLeftDesktop : isImageLeftDesktop;

  return (
    <Theme variant={theme || "dark-shade"}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:pt-28 pt-20">
        {/* Mobile: Image first if isImageLeftMobile is true, else Text first */}
        <div className={`contents lg:hidden ${isImageLeftMobile ? 'order-first' : 'order-last'}`}>
          {isImageLeftMobile && <ImageBlock image={image} />}
          <TextBlock
            tagLine={tagLine}
            title={title}
            body={body}
            showButton={showButton}
            buttonType={buttonType}
            customButton={customButton}
          />
          {!isImageLeftMobile && <ImageBlock image={image} />}
        </div>

        {/* Desktop: Use original layout logic */}
        <div className="hidden lg:contents">
          {isImageLeftDesktop && <ImageBlock image={image} />}
          <TextBlock
            tagLine={tagLine}
            title={title}
            body={body}
            showButton={showButton}
            buttonType={buttonType}
            customButton={customButton}
          />
          {!isImageLeftDesktop && <ImageBlock image={image} />}
        </div>
      </div>
    </Theme>
  );
};

const ImageBlock: React.FC<{ image: any | null }> = ({ image }) => {
  if (!image?.asset?._id) return null;

  return (
    <div className="flex flex-col justify-center">
      <Image
        className="rounded-xl animate-fade-up [animation-delay:500ms] opacity-0"
        src={urlFor(image).url()}
        alt={image.alt || ''}
        width={image.asset?.metadata?.dimensions?.width || 800}
        height={image.asset?.metadata?.dimensions?.height || 800}
        placeholder={image?.asset?.metadata?.lqip ? 'blur' : undefined}
        blurDataURL={image?.asset?.metadata?.lqip || ''}
        quality={100}
      />
    </div>
  );
};

const TextBlock: React.FC<{
  tagLine?: string | null;
  title?: string | null;
  body?: any[] | null;
  showButton?: boolean | null;
  buttonType?: string | null;
  customButton?: { label: string | null; link: string | null; isExternal: boolean | null } | null;
}> = ({ tagLine, title, body, showButton, buttonType, customButton }) => {
  return (
    <div className="flex flex-col justify-center text-left">
      {tagLine && <Subtitle>{tagLine}</Subtitle>}
      {title && <Title>{title}</Title>}
      {body && (
        <Content as="div">
          <PortableTextRenderer value={body} />
        </Content>
      )}
      {showButton && (
        <div className="mt-4 animate-fade-up [animation-delay:400ms] opacity-0">
          {buttonType === "primaryCTA" ? (
            <DoctorSearchDrawer>
              <Button variant="secondary">
                Book an Appointment
              </Button>
            </DoctorSearchDrawer>
          ) : (
            customButton && customButton.label && customButton.link && (
              <Button variant="secondary" asChild>
                {customButton.isExternal ? (
                  <a href={customButton.link} target="_blank" rel="noopener noreferrer">
                    {customButton.label}
                  </a>
                ) : (
                  <Link href={customButton.link}>
                    {customButton.label}
                  </Link>
                )}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default Hero1;