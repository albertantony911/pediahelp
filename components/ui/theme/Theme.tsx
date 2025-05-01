'use client';

import { cn } from "@/lib/utils";
import { TypographyProvider } from "@/components/ui/theme/typography/TypographyProvider";

interface ThemeProps {
  variant: "dark-shade" | "mid-shade" | "light-shade" | "white";
  children: React.ReactNode;
  className?: string;
  disableContainer?: boolean;
  containerType?: "default" | "left" | "right"; // 👈 NEW
}

const backgroundVariants = {
  "dark-shade": "bg-dark-shade",
  "mid-shade": "bg-mid-shade",
  "light-shade": "bg-light-shade",
  "white": "bg-white",
};

export function Theme({
  variant,
  children,
  className,
  disableContainer = false,
  containerType = "default", // 👈 default fallback
}: ThemeProps) {
  const containerClass = {
    default: "container max-sm:px-10",
    left: "left-container",
    right: "right-container",
  }[containerType];

  const content = (
    <TypographyProvider variant={`${variant}-bg` as any}>
      {children}
    </TypographyProvider>
  );

  return (
    <section
      className={cn("w-full text-left", backgroundVariants[variant], className)}
    >
      {disableContainer ? content : <div className={cn(containerClass, "text-left")}>{content}</div>}
    </section>
  );
}