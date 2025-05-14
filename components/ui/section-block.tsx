'use client'

import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import PortableTextRenderer from '@/components/portable-text-renderer'
import { Button, buttonVariants } from '@/components/ui/button'
import { Theme, ThemeVariant } from '@/components/ui/theme/Theme'
import { Title, Subtitle, Content } from '@/components/ui/theme/typography'
import { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

type LayoutOption = 'image-left' | 'image-right' | null

interface SectionBlockProps {
  theme?: ThemeVariant | null
  layout?: LayoutOption
  reverseOnMobile?: boolean | null
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
  reverseOnMobile = false,
  buttonVariant = 'default',
  buttonLabel,
  link,
  tagLine,
  title,
  body,
  image,
}) => {
  const isImageLeftDesktop = layout === 'image-left'
  const isImageLeftMobile = reverseOnMobile ? !isImageLeftDesktop : isImageLeftDesktop

  const href = link?.internalLink?.slug?.current
    ? `/${link.internalLink.slug.current}`
    : link?.externalUrl || null
  const isInternal = !!link?.internalLink?.slug?.current

  return (
    <Theme variant={theme || 'white'}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 ">
        {/* Mobile */}
        <div className={cn('contents lg:hidden', isImageLeftMobile ? 'order-first' : 'order-last')}>
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
              <div className="mt-4 animate-fade-up [animation-delay:400ms] opacity-0">
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

        {/* Desktop */}
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
              <div className="mt-4 animate-fade-up [animation-delay:400ms] opacity-0">
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
    <div className="flex flex-col justify-center w-full max-sm:-mx-10 max-sm:w-[calc(100%+5rem)]">
      <Image
        className="rounded-xl animate-fade-up [animation-delay:500ms] opacity-0 "
        src={urlFor(image).url()}
        alt={image.alt || ''}
        width={dimensions.width || 1000}
        height={dimensions.height || 1000}
        placeholder={lqip ? 'blur' : undefined}
        blurDataURL={lqip}
        quality={100}
      />
    </div>
  )
}

export default SectionBlock