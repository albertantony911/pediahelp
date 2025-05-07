'use client'

import { urlFor } from '@/sanity/lib/image'

interface WaveDividerProps {
  _type: 'waveDivider';
  _key: string;
  variant: {
    label: string | null;
    desktopSvg: {
      asset: {
        _id: string;
        url: string | null;
        mimeType: string | null;
        metadata: {
          dimensions: {
            width: number | null;
            height: number | null;
          } | null;
        } | null;
      } | null;
    } | null;
    mobileSvg: {
      asset: {
        _id: string;
        url: string | null;
        mimeType: string | null;
        metadata: {
          dimensions: {
            width: number | null;
            height: number | null;
          } | null;
        } | null;
      } | null;
    } | null;
  } | null;
}

const WaveDivider: React.FC<WaveDividerProps> = ({ variant }) => {
  if (!variant?.desktopSvg?.asset && !variant?.mobileSvg?.asset) return null

  return (
    <div className="w-full h-[100px] relative">
      {variant?.desktopSvg?.asset?.url && (
        <img
          src={urlFor(variant.desktopSvg).url()}
          alt={`Wave divider desktop - ${variant.label || 'unknown'}`}
          className="hidden lg:block w-full h-full object-cover absolute top-0 left-0"
        />
      )}
      {variant?.mobileSvg?.asset?.url && (
        <img
          src={urlFor(variant.mobileSvg).url()}
          alt={`Wave divider mobile - ${variant.label || 'unknown'}`}
          className="lg:hidden w-full h-full object-cover absolute top-0 left-0"
        />
      )}
    </div>
  )
}

export default WaveDivider