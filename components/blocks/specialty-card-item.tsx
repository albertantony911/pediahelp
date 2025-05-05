import Link from "next/link";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";

interface SpecialtyCardItemProps {
  name?: string | null;
  image?: {
    asset?: {
      _id: string;
      url: string;
      mimeType: string;
      metadata?: {
        lqip?: string;
        dimensions?: {
          width: number;
          height: number;
        };
      };
    };
    alt?: string | null;
  } | null;
  alt?: string | null;
  link?: string | null;
  _key?: string;
}

export default function SpecialtyCardItem({ name, image, alt, link }: SpecialtyCardItemProps) {
  return (
    <Link
      href={link ?? "#"}
      className="group block rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95"
      aria-label={`View specialty: ${name || "Specialty"}`}
    >
      <div className="relative aspect-square">
        {image && image.asset?._id && (
          <Image
            src={urlFor(image).url()}
            alt={alt || name || "Specialty Image"}
            fill
            sizes="(max-width: 640px) 100vw, 25vw"
            className="object-cover"
            quality={100}
            placeholder={image?.asset?.metadata?.lqip ? "blur" : undefined}
            blurDataURL={image?.asset?.metadata?.lqip || ""}
          />
        )}
        {/* Hidden for visual display but available for screen readers */}
        <span className="sr-only">{name || "Specialty"}</span>
        {alt && <span className="sr-only">{alt}</span>}
      </div>
    </Link>
  );
}