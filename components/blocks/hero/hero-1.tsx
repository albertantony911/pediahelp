'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo } from 'react'
import { urlFor } from '@/sanity/lib/image'
import PortableTextRenderer from '@/components/portable-text-renderer'
import { PAGE_QUERYResult } from '@/sanity.types'
import { DoctorSearchDrawer } from '@/components/blocks/doctor/DoctorSearchDrawer'

// Theme & Typography
import { Theme } from '@/components/ui/theme/Theme'
import { Title, Subtitle, Content } from '@/components/ui/theme/typography'

type Hero1Props = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>['blocks']>[number],
  { _type: 'hero-1' }
>

export default function Hero1({ tagLine, title, body, image }: Hero1Props) {
  return (
    <Theme variant="dark-shade">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 py-20 lg:pt-40">
        <div className="flex flex-col justify-center">
          {tagLine && <Subtitle>{tagLine}</Subtitle>}
          {title && <Title>{title}</Title>}
          {body && (
            <Content as="div">
              <PortableTextRenderer value={body} />
            </Content>
          )}

          <div className="mt-8 animate-fade-up [animation-delay:400ms] opacity-0">
            <DoctorSearchDrawer>
              <button className="bg-mid-shade text-white  font-bold px-6 py-3 rounded-full">
                Book a Consultation
              </button>
            </DoctorSearchDrawer>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          {image && image.asset?._id && (
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
          )}
        </div>
      </div>
    </Theme>
  )
}