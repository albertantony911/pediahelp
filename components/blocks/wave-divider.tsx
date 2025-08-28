// components/blocks/wave-divider.tsx
'use client'

import { urlFor } from '@/sanity/lib/image'
import React from 'react'

interface WaveDividerProps {
  _type: 'waveDivider'
  _key: string
  variant: {
    label: string | null
    desktopSvg?: { asset?: { _id: string; url: string | null } } | null
    mobileSvg?:  { asset?: { _id: string; url: string | null } } | null
  } | null
}

const WaveDivider: React.FC<WaveDividerProps> = ({ variant }) => {
  const desktop = variant?.desktopSvg?.asset ? urlFor(variant.desktopSvg).url() : null
  const mobile  = variant?.mobileSvg?.asset  ? urlFor(variant.mobileSvg).url()  : null
  if (!desktop && !mobile) return null

  return (
    <div
      className={[
        'relative h-[100px]',
        'overflow-hidden isolate select-none', // contain + paint above neighbors
      ].join(' ')}
      aria-hidden
    >
      {/* Desktop (≥ lg) */}
      {desktop && (
        <div
          className={[
            'hidden lg:block absolute -inset-px', // ← 1px overdraw on ALL sides
            'bg-center bg-cover will-change-transform pointer-events-none',
          ].join(' ')}
          style={{ backgroundImage: `url("${desktop}")` }}
        />
      )}

      {/* Mobile (< lg) */}
      {mobile && (
        <div
          className={[
            'block lg:hidden absolute -inset-px',
            'bg-center bg-cover will-change-transform pointer-events-none',
          ].join(' ')}
          style={{ backgroundImage: `url("${mobile}")` }}
        />
      )}
    </div>
  )
}

export default WaveDivider