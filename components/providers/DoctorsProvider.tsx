'use client';

import { createContext, useContext } from 'react';
import type { Doctor } from '@/types';

const DoctorsContext = createContext<Doctor[] | undefined>(undefined);

export function DoctorsProvider({
  allDoctors,
  children,
}: {
  allDoctors: Doctor[];
  children: React.ReactNode;
}) {
  return (
    <DoctorsContext.Provider value={allDoctors}>
      {children}
    </DoctorsContext.Provider>
  );
}

export function useDoctors(): Doctor[] {
  const context = useContext(DoctorsContext);
  if (!context) {
    throw new Error('useDoctors must be used within DoctorsProvider');
  }
  return context;
}