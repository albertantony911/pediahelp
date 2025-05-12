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
      const containerWidth =
        containerRef.current.parentElement?.offsetWidth || window.innerWidth;

      const charLimit = containerWidth <= 640
        ? Math.floor(containerWidth / 10)
        : Math.floor(containerWidth / 8);

      const maxChars = Math.min(charLimit, containerWidth <= 640 ? 50 : 100);

      if (label.length > maxChars) {
        const words = label.slice(0, maxChars - 3).split(' ');
        words.pop();
        setTruncatedLabel(words.join(' ') + '...');
      } else {
        setTruncatedLabel(label);
      }
    }
  }, [label, isCurrent]);

  return (
    <BreadcrumbItem ref={containerRef} className="font-semibold text-primary whitespace-nowrap">
      {!isCurrent ? (
        <BreadcrumbLink asChild className="hover:underline text-gray-700 dark:text-gray-300">
          <Link href={href}>{label}</Link>
        </BreadcrumbLink>
      ) : (
        <BreadcrumbPage className="font-bold text-gray-900 dark:text-white">
          {truncatedLabel}
        </BreadcrumbPage>
      )}
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
          'flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-sm',
          'text-gray-800 dark:text-gray-100'
        )}
        style={{ whiteSpace: 'nowrap' }}
      >
        {links.map((link, index) => (
          <span key={link.label} className="flex items-center">
            <BreadcrumbCustomItem
              label={link.label}
              href={link.href}
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
