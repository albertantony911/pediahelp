'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTypographyVariant } from "./TypographyProvider";

interface TitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  variant?: "dark-shade-bg" | "mid-shade-bg" | "light-shade-bg" | "white-bg";
}

export function Title({ className, variant, ...props }: TitleProps) {
  const contextVariant = useTypographyVariant();
  const activeVariant = variant || contextVariant;

  const variantClasses = {
    "dark-shade-bg": "text-white",
    "mid-shade-bg": "text-white",
    "light-shade-bg": "text-dark-shade",
    "white-bg": "text-dark-shade",
  };

  return (
    <h2
      className={cn(
        "mt-[10px] md:mt-2 font-bold font-sans text-[28px] md:text-4xl lg:text-4xl leading-[1.25] md:leading-[1.2] tracking-tight  animate-fade-up [animation-delay:200ms] opacity-0",
        variantClasses[activeVariant],
        className
      )}
      {...props}
    />
  );
}