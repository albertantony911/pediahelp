import Image from 'next/image';
import { urlFor } from '@/sanity/lib/image';

interface SpecialtyCardItemProps {
  name?: string | null;
  image?: {
    asset?: {
      _id: string;
      url: string | null;
      mimeType: string | null;
      metadata?: {
        lqip?: string | null;
        dimensions?: { width: number; height: number } | null;
      } | null;
    } | null;
    alt?: string | null;
    _type: 'image';
  } | null;
  _key?: string;
}

export default function SpecialtyCardItem({ name, image }: SpecialtyCardItemProps) {
  if (!image?.asset?._id) return null;

  const lqip = image.asset?.metadata?.lqip || '';

  return (
    <div className="flex flex-col items-center rounded-2xl shadow-md w-full overflow-hidden">
      <Image
        className="rounded-2xl object-cover w-full h-auto aspect-square"
        src={urlFor(image).url()}
        alt={image.alt || ''}
        width={300}
        height={300}
        placeholder={lqip ? 'blur' : undefined}
        blurDataURL={lqip}
        quality={100}
      />
      {name && <p className="sr-only mt-2 text-center text-sm font-medium px-2 pb-2">{name}</p>}
    </div>
  );
}