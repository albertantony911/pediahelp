'use client'

import Image from 'next/image'
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
  buttonVariant?: VariantProps<typeof buttonVariants>['variant'] | null
  buttonLabel?: string | null
  href?: string | null
  tagLine?: string | null
  title?: string | null
  body?: any[] | null
  image?: any | null
}

const SectionBlock: React.FC<SectionBlockProps> = ({
  theme = 'white',
  layout = 'image-right',
  buttonVariant = 'default',
  buttonLabel,
  href,
  tagLine,
  title,
  body,
  image,
}) => {
  const isImageLeft = layout === 'image-left'

  return (
    <Theme variant={theme || 'white'}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 py-20 lg:pt-40">
        {isImageLeft && <ImageBlock image={image} />}
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
              <Button variant={buttonVariant ?? 'default'} href={href}>
                {buttonLabel}
              </Button>
            </div>
          )}
        </div>
        {!isImageLeft && <ImageBlock image={image} />}
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