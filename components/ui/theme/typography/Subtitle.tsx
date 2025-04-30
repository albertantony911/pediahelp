'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTypographyVariant } from "./TypographyProvider";

interface SubtitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  variant?: "dark-shade-bg" | "mid-shade-bg" | "light-shade-bg" | "white-bg";
}

export function Subtitle({ className, variant, ...props }: SubtitleProps) {
  const contextVariant = useTypographyVariant();
  const activeVariant = variant || contextVariant;

  const variantClasses = {
    "dark-shade-bg": "text-light-shade",
    "mid-shade-bg": "text-light-shade",
    "light-shade-bg": "text-mid-shade",
    "white-bg": "text-mid-shade",
  };

  return (
    <h3
      className={cn(
        "font-secondary uppercase font-bold tracking-wider text-xs md:text-base leading-[1.3] animate-fade-up [animation-delay:100ms] opacity-0",
        variantClasses[activeVariant],
        className
      )}
      {...props}
    />
  );
}