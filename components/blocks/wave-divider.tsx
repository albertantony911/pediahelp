'use client';

import { urlFor } from '@/sanity/lib/image';
import React from 'react';

type SanityVariant = {
  label: string | null;
  desktopSvg?: { asset?: { _id: string; url: string | null } } | null;
  mobileSvg?:  { asset?: { _id: string; url: string | null } } | null;
};

type Props =
  | { _type?: 'waveDivider'; _key?: string; variant: SanityVariant | null; desktopSrc?: never; mobileSrc?: never; height?: number; bleed?: boolean; className?: string }
  | { _type?: 'waveDivider'; _key?: string; variant?: null; desktopSrc?: string | null; mobileSrc?: string | null; height?: number; bleed?: boolean; className?: string };

const WaveDivider: React.FC<Props> = ({ variant, desktopSrc, mobileSrc, height = 100, bleed = true, className = '' }) => {
  const desktop =
    desktopSrc ??
    (variant?.desktopSvg?.asset ? urlFor(variant.desktopSvg).url() : null);
  const mobile =
    mobileSrc ??
    (variant?.mobileSvg?.asset ? urlFor(variant.mobileSvg).url() : null);

  if (!desktop && !mobile) return null;

  return (
    <div
      className={[
        bleed ? 'w-screen -mx-[calc(50vw-50%)]' : '',
        'relative isolate overflow-hidden select-none',
        className,
      ].join(' ')}
      style={{ height }}
      aria-hidden
    >
      {desktop && (
        <div
          className="hidden lg:block absolute -inset-px bg-center bg-cover will-change-transform pointer-events-none"
          style={{ backgroundImage: `url("${desktop}")` }}
        />
      )}
      {mobile && (
        <div
          className="block lg:hidden absolute -inset-px bg-center bg-cover will-change-transform pointer-events-none"
          style={{ backgroundImage: `url("${mobile}")` }}
        />
      )}
    </div>
  );
};

export default WaveDivider;