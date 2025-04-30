'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTypographyVariant } from "./TypographyProvider";

interface ContentProps extends React.HTMLAttributes<HTMLParagraphElement> {
  variant?: "dark-shade-bg" | "mid-shade-bg" | "light-shade-bg" | "white-bg";
  as?: keyof JSX.IntrinsicElements;
}

export function Content({ className, variant, as = "p", ...props }: ContentProps) {
  const contextVariant = useTypographyVariant();
  const activeVariant = variant || contextVariant;

  const variantClasses = {
    "dark-shade-bg": "text-white/80",
    "mid-shade-bg": "text-white/90",
    "light-shade-bg": "text-dark-shade/90",
    "white-bg": "text-dark-shade/90",
  };

  const Component = as as any;

  return (
    <Component
      className={cn(
        "mt-[4px] md:mt-6 font-normal font-sans text-base md:text-lg leading-relaxed animate-fade-up [animation-delay:400ms] opacity-0",
        variantClasses[activeVariant],
        className
      )}
      {...props}
    />
  );
}