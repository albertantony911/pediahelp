'use client';

import { cn } from "@/lib/utils";
import { TypographyProvider } from "@/components/ui/theme/typography/TypographyProvider";

interface ThemeProps {
  variant: "dark-shade" | "mid-shade" | "light-shade" | "white";
  children: React.ReactNode;
  className?: string;
}

const backgroundVariants = {
  "dark-shade": "bg-dark-shade",
  "mid-shade": "bg-mid-shade",
  "light-shade": "bg-light-shade",
  "white": "bg-white",
};

export function Theme({ variant, children, className }: ThemeProps) {
  return (
    <section className={cn("w-full", backgroundVariants[variant], className)}>
      <div className="container max-sm:px-10 ">
        <TypographyProvider variant={`${variant}-bg` as any}>
          {children}
        </TypographyProvider>
      </div>
    </section>
  );
}