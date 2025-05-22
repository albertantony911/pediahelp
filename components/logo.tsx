'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center justify-center" aria-label="Homepage">
      <Image
        src="/images/logo.svg"
        alt="Pediahelp Logo"
        width={160}
        height={64}
        priority
      />
    </Link>
  );
}