'use client';

import {
  Droplets,
  Flame,
  Baby,
  Brain,
  HeartPulse,
  Stethoscope,
  LucideIcon,
} from 'lucide-react';
import { useRef, useEffect } from 'react';
import clsx from 'clsx';

const specialties: { name: string; label: string; icon: LucideIcon }[] = [
  { name: 'Pediatric Nephrology', label: 'Nephrology', icon: Droplets },
  { name: 'Pediatric Gastroenterology', label: 'Gastro', icon: Flame },
  { name: 'Neonatology', label: 'Neonatal', icon: Baby },
  { name: 'Pediatric Neurology', label: 'Neurology', icon: Brain },
  { name: 'Lactation Consultant', label: 'Lactation', icon: HeartPulse },
  { name: 'Pediatric Respiratory Medicine and Sleep Medicine', label: 'Resp. & Sleep', icon: Stethoscope },
  { name: 'Pediatric Endocrinology', label: 'Endocrinology', icon: HeartPulse },
];

export default function SpecialtyFilter({
  onFilter,
  onReset,
  selectedSpecialty,
}: {
  onFilter: (specialty: string) => void;
  onReset: () => void;
  selectedSpecialty?: string;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selectedSpecialty || !scrollRef.current) return;
    const index = specialties.findIndex((s) => s.name === selectedSpecialty);
    if (index >= 0) {
      const scrollContainer = scrollRef.current;
      const target = scrollContainer.children[index] as HTMLElement;
      if (target) {
        scrollContainer.scrollTo({
          left: target.offsetLeft - 16,
          behavior: 'smooth',
        });
      }
    }
  }, [selectedSpecialty]);

  return (
    <div className="w-full overflow-x-auto pb-1">
      <div
        ref={scrollRef}
        className="flex gap-3 px-4 py-2 scroll-snap-x snap-x snap-mandatory overflow-x-auto"
      >
        {specialties.map(({ name, label, icon: Icon }) => {
          const isActive = selectedSpecialty === name;
          return (
            <button
              key={name}
              onClick={() => onFilter(name)}
              className={clsx(
                'flex flex-col items-center snap-start shrink-0 w-20',
                isActive && 'scale-105'
              )}
            >
              <div
                className={clsx(
                  'w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border transition-all',
                  isActive ? 'bg-green-100 border-green-400' : 'bg-white border-gray-200'
                )}
              >
                <Icon className="w-6 h-6 text-green-600" />
              </div>
              <span className="mt-1 text-[11px] text-center text-gray-700 font-medium leading-tight">
                {label}
              </span>
            </button>
          );
        })}

        <button
          onClick={onReset}
          className="flex flex-col items-center snap-start shrink-0 w-20"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm border border-gray-300 bg-gray-100 hover:bg-gray-200 transition">
            <Stethoscope className="w-6 h-6 text-green-600" />
          </div>
          <span className="mt-1 text-[11px] text-center text-gray-700 font-medium leading-tight">
            All
          </span>
        </button>
      </div>
    </div>
  );
}