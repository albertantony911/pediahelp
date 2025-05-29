'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Logo() {
  return (
    <Link href="/" className="flex  justify-center py-2 " aria-label="Homepage">
      <Image
        src="/images/logo.svg"
        alt="Pediahelp Logo"
        width={192}
        height={64}
        priority
      />
    </Link>
  );
}