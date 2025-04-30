'use client';

import * as React from "react";

type VariantType = "dark-shade-bg" | "mid-shade-bg" | "light-shade-bg" | "white-bg";

const TypographyContext = React.createContext<VariantType>("white-bg");

export const useTypographyVariant = () => React.useContext(TypographyContext);

interface TypographyProviderProps {
  variant: VariantType;
  children: React.ReactNode;
}

export function TypographyProvider({ variant, children }: TypographyProviderProps) {
  return (
    <TypographyContext.Provider value={variant}>
      {children}
    </TypographyContext.Provider>
  );
}