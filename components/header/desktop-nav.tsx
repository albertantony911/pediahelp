'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type SubItem = {
  label: string;
  href: string;
  target: boolean;
};

type NavItem = {
  label: string;
  href: string;
  target: boolean;
  subItems?: SubItem[];
};

type DesktopNavProps = {
  navItems: NavItem[];
};

export default function DesktopNav({ navItems }: DesktopNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Desktop navigation" className="flex gap-6 items-center">
      {navItems.map(({ label, href, target, subItems }) => (
        <div key={label} className="relative group">
          <Link
            href={href}
            target={target ? "_blank" : undefined}
            rel={target ? "noopener noreferrer" : undefined}
            className={cn(
              "text-base font-medium text-red-400 hover:text-red-300",
              "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300",
              pathname === href && "text-red-500",
            )}
            aria-label={label}
          >
            {label}
          </Link>
          {/* Dropdown for sub-items */}
          {subItems && subItems.length > 0 && (
            <div className="absolute left-0 mt-2 w-48 bg-white text-teal-900 rounded-md shadow-lg opacity-0 group-hover:opacity-100 group-hover:visible invisible transition-opacity duration-200">
              {subItems.map((subItem) => (
                <Link
                  key={subItem.label}
                  href={subItem.href}
                  target={subItem.target ? "_blank" : undefined}
                  rel={subItem.target ? "noopener noreferrer" : undefined}
                  className="block px-4 py-2 text-sm hover:bg-teal-100 transition"
                >
                  {subItem.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}