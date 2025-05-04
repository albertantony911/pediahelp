'use client'

import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import PortableTextRenderer from '@/components/portable-text-renderer'
import { Button, buttonVariants } from '@/components/ui/button'
import { Theme, ThemeVariant } from '@/components/ui/theme/Theme'
import { Title, Subtitle, Content } from '@/components/ui/theme/typography'
import { VariantProps } from 'class-variance-authority'

type LayoutOption = 'image-left' | 'image-right' | null

interface SectionBlockProps {
  theme?: ThemeVariant | null
  layout?: LayoutOption
  reverseOnMobile: boolean | null // Updated to match expected type
  buttonVariant?: VariantProps<typeof buttonVariants>['variant'] | null
  buttonLabel?: string | null
  link?: {
    internalLink: { slug: { current: string | null } | null } | null
    externalUrl: string | null
  } | null
  tagLine?: string | null
  title?: string | null
  body?: any[] | null
  image?: any | null
}

const SectionBlock: React.FC<SectionBlockProps> = ({
  theme = 'white',
  layout = 'image-right',
  reverseOnMobile = false, // Default to false, which is compatible with boolean | null
  buttonVariant = 'default',
  buttonLabel,
  link,
  tagLine,
  title,
  body,
  image,
}) => {
  // Desktop layout: true if image is on the left
  const isImageLeftDesktop = layout === 'image-left'

  // Mobile layout: reverse the desktop layout if reverseOnMobile is true
  const isImageLeftMobile = reverseOnMobile ? !isImageLeftDesktop : isImageLeftDesktop

  // Determine the href and whether it's internal
  const href = link?.internalLink?.slug?.current
    ? `/${link.internalLink.slug.current}`
    : link?.externalUrl || null
  const isInternal = !!link?.internalLink?.slug?.current

  return (
    <Theme variant={theme || 'white'}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 py-20 ">
        {/* Mobile: Image first if isImageLeftMobile is true, else Text first */}
        <div className={`contents lg:hidden ${isImageLeftMobile ? 'order-first' : 'order-last'}`}>
          {isImageLeftMobile && <ImageBlock image={image} />}
          <div className="flex flex-col justify-center">
            {tagLine && <Subtitle>{tagLine}</Subtitle>}
            {title && <Title>{title}</Title>}
            {Array.isArray(body) && body.length > 0 && (
              <Content as="div">
                <PortableTextRenderer value={body} />
              </Content>
            )}
            {buttonLabel && href && (
              <div className="mt-8 animate-fade-up [animation-delay:400ms] opacity-0">
                {isInternal ? (
                  <Button asChild variant={buttonVariant ?? 'default'}>
                    <Link href={href}>{buttonLabel}</Link>
                  </Button>
                ) : (
                  <Button variant={buttonVariant ?? 'default'} href={href}>
                    {buttonLabel}
                  </Button>
                )}
              </div>
            )}
          </div>
          {!isImageLeftMobile && <ImageBlock image={image} />}
        </div>

        {/* Desktop: Use original layout logic */}
        <div className="hidden lg:contents">
          {isImageLeftDesktop && <ImageBlock image={image} />}
          <div className="flex flex-col justify-center">
            {tagLine && <Subtitle>{tagLine}</Subtitle>}
            {title && <Title>{title}</Title>}
            {Array.isArray(body) && body.length > 0 && (
              <Content as="div">
                <PortableTextRenderer value={body} />
              </Content>
            )}
            {buttonLabel && href && (
              <div className="mt-8 animate-fade-up [animation-delay:400ms] opacity-0">
                {isInternal ? (
                  <Button asChild variant={buttonVariant ?? 'default'}>
                    <Link href={href}>{buttonLabel}</Link>
                  </Button>
                ) : (
                  <Button variant={buttonVariant ?? 'default'} href={href}>
                    {buttonLabel}
                  </Button>
                )}
              </div>
            )}
          </div>
          {!isImageLeftDesktop && <ImageBlock image={image} />}
        </div>
      </div>
    </Theme>
  )
}

const ImageBlock: React.FC<{ image: any | null }> = ({ image }) => {
  if (!image?.asset?._id) return null

  const dimensions = image.asset?.metadata?.dimensions || {}
  const lqip = image.asset?.metadata?.lqip || ''

  return (
    <div className="flex flex-col justify-center">
      <Image
        className="rounded-xl animate-fade-up [animation-delay:500ms] opacity-0"
        src={urlFor(image).url()}
        alt={image.alt || ''}
        width={dimensions.width || 800}
        height={dimensions.height || 800}
        placeholder={lqip ? 'blur' : undefined}
        blurDataURL={lqip}
        quality={100}
      />
    </div>
  )
}

export default SectionBlock