'use client';

import { cn } from "@/lib/utils";

interface BackgroundStylesProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "dark-shade" | "mid-shade" | "light-shade" | "white";
}

const backgroundVariants = {
  "dark-shade": "bg-[--dark-shade]",
  "mid-shade": "bg-[--mid-shade]",
  "light-shade": "bg-[--light-shade]",
  "white": "bg-white",
};

export function BackgroundStyles({
  variant = "white",
  className,
  ...props
}: BackgroundStylesProps) {
  return (
    <div
      className={cn(
        "w-full",
        backgroundVariants[variant],
        className
      )}
      {...props}
    />
  );
}