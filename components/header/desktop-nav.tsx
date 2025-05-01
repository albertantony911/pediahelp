'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  href: string;
  target: boolean;
};

type DesktopNavProps = {
  navItems: NavItem[];
};

export default function DesktopNav({ navItems }: DesktopNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Desktop navigation" className="flex gap-8 items-center">
      {navItems.map(({ label, href, target }) => (
        <Link
          key={label}
          href={href}
          target={target ? "_blank" : undefined}
          rel={target ? "noopener noreferrer" : undefined}
          className={cn(
            "text-base font-medium text-muted-foreground hover:text-blue-500",
            "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300",
            pathname === href && "text-blue-500 relative",
            pathname === href &&
              "before:absolute before:bottom-0 before:h-0.5 before:w-full before:bg-blue-200 before:rounded-full"
          )}
          aria-label={label}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}