// @/components/ui/breadcrumbs.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { BreadcrumbLink as BreadcrumbLinkType } from '@/types';

const BreadcrumbCustomItem = ({
  label,
  href,
  isCurrent,
}: BreadcrumbLinkType & { isCurrent?: boolean }) => {
  const [truncatedLabel, setTruncatedLabel] = useState(label);
  const containerRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (isCurrent && containerRef.current) {
      // Estimate available width based on parent container
      const containerWidth = containerRef.current.parentElement?.offsetWidth || window.innerWidth;
      // Approximate chars based on width (assuming ~10px per char for text-sm)
      const charLimit = containerWidth <= 640 ? Math.floor(containerWidth / 10) : Math.floor(containerWidth / 8);
      // Cap at reasonable limits: 30 for mobile, 40 for desktop
      const maxChars = Math.min(charLimit, containerWidth <= 640 ? 50 : 100);
      
      if (label.length > maxChars) {
        // Truncate at the last full word
        const words = label.slice(0, maxChars - 3).split(' ');
        words.pop(); // Remove partial word
        setTruncatedLabel(words.join(' ') + '...');
      } else {
        setTruncatedLabel(label);
      }
    }
  }, [label, isCurrent]);

  return (
    <BreadcrumbItem ref={containerRef} className="font-bold text-primary">
      {!isCurrent ? (
        <BreadcrumbLink asChild className="hover:text-primary/70">
          <Link href={href}>{label}</Link>
        </BreadcrumbLink>
      ) : (
        <BreadcrumbPage>{truncatedLabel}</BreadcrumbPage>
      )}
      {!isCurrent && <BreadcrumbSeparator className="text-primary" />}
    </BreadcrumbItem>
  );
};

export default function Breadcrumbs({
  links,
}: {
  links: BreadcrumbLinkType[];
}) {
  return (
    <Breadcrumb className="mb-3 lg:mb-6">
      <BreadcrumbList
        className={cn(
          'flex items-center gap-1.5 sm:gap-2.5 text-sm text-muted-foreground'
        )}
        style={{ whiteSpace: 'nowrap' }}
      >
        {links.map((link, index) => (
          <span key={link.label} className="flex items-center">
            <BreadcrumbCustomItem
              {...link}
              isCurrent={index === links.length - 1}
            />
            {index < links.length - 1 && (
              <BreadcrumbSeparator className="text-primary" />
            )}
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
