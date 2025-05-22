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

// Define the type inline for now; move to '@/types' after confirming
interface BreadcrumbLinkType {
  label: string;
  href: string;
}

const BreadcrumbCustomItem = ({
  label,
  href,
  isCurrent,
  availableWidth,
}: BreadcrumbLinkType & { isCurrent?: boolean; availableWidth?: number }) => {
  const [displayLabel, setDisplayLabel] = useState(label);
  const itemRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!isCurrent || !itemRef.current || availableWidth === undefined) {
      setDisplayLabel(label);
      return;
    }

    // Measure the rendered width of the text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;

    // Approximate the font style (adjust based on your CSS)
    context.font = '600 14px sans-serif'; // Match the font used; 'font-semibold' is ~600
    const textWidth = context.measureText(label).width;

    // If the text width exceeds the available width, truncate
    if (textWidth > availableWidth) {
      let truncated = label;
      let currentWidth = textWidth;

      // Add space for "..." (approximate width)
      const ellipsisWidth = context.measureText('...').width;
      let targetWidth = availableWidth - ellipsisWidth;

      // Truncate character by character until it fits
      while (currentWidth > targetWidth && truncated.length > 1) {
        truncated = truncated.slice(0, -1);
        currentWidth = context.measureText(truncated).width;
      }

      setDisplayLabel(truncated + '...');
    } else {
      setDisplayLabel(label);
    }
  }, [label, isCurrent, availableWidth]);

  return (
    <BreadcrumbItem
      ref={itemRef}
      className="font-semibold text-primary whitespace-nowrap"
    >
      {!isCurrent ? (
        <BreadcrumbLink
          asChild
          className="sm:hover:underline text-gray-700 dark:text-gray-300"
        >
          <Link href={href}>{label}</Link>
        </BreadcrumbLink>
      ) : (
        <BreadcrumbPage className="text-gray-900 dark:text-white">
          {displayLabel}
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
  const listRef = useRef<HTMLOListElement>(null);
  const [availableWidth, setAvailableWidth] = useState<number | undefined>(
    undefined
  );
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 640; // Tailwind's 'sm' breakpoint
      setIsMobile(mobile);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    if (!listRef.current) return;

    const calculateWidths = () => {
      const containerWidth = listRef.current?.offsetWidth || window.innerWidth;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return;

      // Font styles for items and separators (use same weight for consistency)
      context.font = '600 14px sans-serif'; // Match 'font-semibold' (~600)
      const separatorFont = '600 14px sans-serif'; // Match separator font weight

      // Calculate the total width of all items except the last one
      let totalWidthExcludingLast = 0;

      links.forEach((link, index) => {
        if (index < links.length - 1) {
          // Add width of the link text (no truncation for earlier items)
          totalWidthExcludingLast += context.measureText(link.label).width;

          // Add width of the separator
          context.font = separatorFont;
          totalWidthExcludingLast += context.measureText('/').width;
          context.font = '600 14px sans-serif'; // Reset font
        }
      });

      // Add gaps between items (approximate based on your CSS)
      const gapBetweenItems = 10; // Adjust based on your gap-1.5 or gap-2.5
      totalWidthExcludingLast += gapBetweenItems * (links.length - 1);

      // Calculate available width for the last item (blog title)
      const remainingWidth = containerWidth - totalWidthExcludingLast;
      setAvailableWidth(Math.max(remainingWidth, 50)); // Ensure a minimum width for the last item
    };

    calculateWidths();

    // Recalculate on window resize
    window.addEventListener('resize', calculateWidths);
    return () => window.removeEventListener('resize', calculateWidths);
  }, [links]);

  return (
    <Breadcrumb className="mb-3 lg:mb-6">
      <BreadcrumbList
        ref={listRef}
        className={cn(
          'flex items-center gap-1.5 sm:gap-2.5 text-sm',
          'text-gray-800 dark:text-gray-100',
          isMobile ? '' : 'overflow-x-auto' // Remove scrolling on mobile
        )}
        style={{ whiteSpace: 'nowrap', flexWrap: 'nowrap' }}
      >
        {links.map((link, index) => (
          <span key={link.label} className="flex items-center">
            <BreadcrumbCustomItem
              label={link.label}
              href={link.href}
              isCurrent={index === links.length - 1}
              availableWidth={
                index === links.length - 1 ? availableWidth : undefined
              }
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