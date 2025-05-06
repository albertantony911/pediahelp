'use client';

import {
  Droplets,
  Flame,
  Baby,
  Brain,
  HeartPulse,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { useSearchBox } from 'react-instantsearch';

const specialties: { name: string; label: string; icon: LucideIcon }[] = [
  { name: 'Pediatric Nephrology', label: 'Nephrology', icon: Droplets },
  { name: 'Pediatric Gastroenterology', label: 'Gastro', icon: Flame },
  { name: 'Neonatology', label: 'Neonatal', icon: Baby },
  { name: 'Pediatric Neurology', label: 'Neurology', icon: Brain },
  { name: 'Lactation Consultant', label: 'Lactation', icon: HeartPulse },
  { name: 'Pediatric Respiratory Medicine and Sleep Medicine', label: 'Resp. & Sleep', icon: Stethoscope },
  { name: 'Pediatric Endocrinology', label: 'Endocrinology', icon: HeartPulse },
];

export default function SpecialtyFilter() {
  const { refine } = useSearchBox();
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [isTouched, setIsTouched] = useState<Record<string, boolean>>({});
  const [isToggleTouched, setIsToggleTouched] = useState(false);

  const visible = expanded ? specialties : specialties.slice(0, 4);

  const handleSelect = (name: string) => {
    setSelected(name);
    refine(name);
    setExpanded(false);
  };

  const handleReset = () => {
    setSelected(null);
    refine('');
    setExpanded(false);
  };

  // Handle touch start for mobile (specialty/reset buttons)
  const handleTouchStart = (key: string) => {
    setIsTouched((prev) => ({ ...prev, [key]: true }));
  };

  // Handle touch end with a delay for animation (specialty/reset buttons)
  const handleTouchEnd = (key: string) => {
    setTimeout(() => {
      setIsTouched((prev) => ({ ...prev, [key]: false }));
    }, 100);
  };

  // Handle touch start for toggle button
  const handleToggleTouchStart = () => {
    setIsToggleTouched(true);
  };

  // Handle touch end for toggle button
  const handleToggleTouchEnd = () => {
    setTimeout(() => {
      setIsToggleTouched(false);
    }, 100);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-4 mt-2">
      <div
        className={clsx(
          'grid grid-cols-4 gap-y-4 gap-x-2 transition-all duration-300',
          expanded ? 'max-h-[600px]' : 'max-h-[160px] overflow-hidden'
        )}
      >
        {visible.map(({ name, label, icon: Icon }) => {
          const isActive = selected === name;
          return (
            <button
              key={name}
              onClick={() => handleSelect(name)}
              onTouchStart={() => handleTouchStart(name)}
              onTouchEnd={() => handleTouchEnd(name)}
              className="group flex flex-col mt-1 items-center justify-center"
            >
              <div
                className={clsx(
                  'w-14 h-14 rounded-full bg-white text-green-600 shadow-sm flex items-center justify-center transition-all duration-300 hover:shadow-md hover:scale-105 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 active:brightness-105',
                  isActive && 'ring-2 ring-green-500 scale-105',
                  isTouched[name] && 'scale-95 brightness-105'
                )}
              >
                <Icon className="w-7 h-7" />
              </div>
              <span className="mt-1 text-xs text-white font-medium text-center leading-tight">
                {label}
              </span>
            </button>
          );
        })}

        {expanded && (
          <button
            onClick={handleReset}
            onTouchStart={() => handleTouchStart('reset')}
            onTouchEnd={() => handleTouchEnd('reset')}
            className="group flex flex-col items-center justify-center"
          >
            <div
              className={clsx(
                'w-14 h-14 rounded-full bg-white text-green-600 shadow-sm flex items-center justify-center transition-all duration-300 hover:shadow-md hover:scale-105 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 active:brightness-105',
                isTouched['reset'] && 'scale-95 brightness-105'
              )}
            >
              <Stethoscope className="w-7 h-7" />
            </div>
            <span className="mt-1 text-xs text-white font-medium text-center">All</span>
          </button>
        )}
      </div>

      <div className="flex justify-center mt-5 pr-1">
        <button
          onClick={() => setExpanded(!expanded)}
          onTouchStart={handleToggleTouchStart}
          onTouchEnd={handleToggleTouchEnd}
          className={clsx(
            'px-4 py-2 rounded-full bg-white text-green-600 text-sm flex items-center gap-1 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-95 active:brightness-105',
            isToggleTouched && 'scale-95 brightness-105'
          )}
        >
          {expanded ? (
            <>
              Collapse <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              See All Specialties <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}