'use client';

import {
  ChevronDown,
  Tag,
  ClipboardList,
  Baby,
  Brain,
  Droplets,
  CloudDrizzle,
  FlaskConical,
  XCircle,
  LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { useSearchBox } from 'react-instantsearch';
import { motion, AnimatePresence } from 'framer-motion';

const specialties: { name: string; label: string; icon: LucideIcon; color: string }[] = [
  { name: 'Pediatric Nephrology', label: 'Nephrology', icon: Tag, color: '#3B82F6' },
  { name: 'Pediatric Gastroenterology', label: 'Gastro', icon: ClipboardList, color: '#10B981' },
  { name: 'Neonatology', label: 'Neonatal', icon: Baby, color: '#F59E0B' },
  { name: 'Pediatric Neurology', label: 'Neurology', icon: Brain, color: '#8B5CF6' },
  { name: 'Lactation Consultant', label: 'Lactation', icon: Droplets, color: '#EC4899' },
  {
    name: 'Pediatric Respiratory Medicine and Sleep Medicine',
    label: 'Resp. & Sleep',
    icon: CloudDrizzle,
    color: '#06B6D4',
  },
  { name: 'Pediatric Endocrinology', label: 'Endocrinology', icon: FlaskConical, color: '#EF4444' },
];

export default function SpecialtyFilter() {
  const { refine } = useSearchBox();
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [clicked, setClicked] = useState<string | null>(null);

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

  const alwaysVisible = isDesktop ? specialties : specialties.slice(0, 3);
  const expandable = isDesktop ? [] : specialties.slice(3);

  const handleToggle = () => setExpanded((prev) => !prev);

  const handleSelect = (name: string | null) => {
    setClicked(name ?? 'reset');
    setSelected(name);
    refine(name ?? '');
    setTimeout(() => setClicked(null), 300);
  };

  const renderButton = (
    name: string,
    label: string,
    Icon: LucideIcon,
    color: string,
    index: number
  ) => {
    const isActive = selected === name;
    const isClicked = clicked === name;

    return (
      <motion.button
        key={name}
        onClick={() => handleSelect(name)}
        className="group flex flex-col items-center justify-center mt-1 sm:mt-5 snap-center"
        aria-label={`Filter by ${label}`}
        aria-pressed={isActive}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ delay: index * 0.04, duration: 0.4 }}
      >
        <div
          className={clsx(
            'w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm group-hover:scale-105 group-focus:ring-2 group-focus:ring-[var(--mid-shade)]',
            isActive
              ? 'bg-[var(--mid-shade)] text-white shadow-md scale-105'
              : 'bg-transparent text-white/70 ring-1 ring-inset ring-[var(--mid-shade)] hover:bg-[var(--mid-shade)]/10 active:scale-95',
            isClicked && 'animate-icon-pulse'
          )}
          style={{ borderColor: isActive ? color : undefined }}
        >
          <Icon className="w-6 h-6" style={{ color: isActive ? color : undefined }} />
        </div>
        <span className="mt-1 text-xs text-white/90 font-medium text-center leading-tight">
          {label}
        </span>
      </motion.button>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-2 sm:mt-0 mb-10 sm:mb-14 z-10 relative">
      {/* Always-visible grid */}
      <div
        className={clsx(
          'grid grid-cols-4 px-4 sm:grid-cols-5 md:grid-cols-8 gap-y-4 gap-x-3 md:gap-x-2',
          'scroll-smooth snap-x snap-mandatory md:snap-none'
        )}
      >
        {/* Reset button */}
        <motion.button
          key="reset"
          onClick={() => handleSelect(null)}
          className="group flex flex-col items-center justify-center snap-center relative"
          aria-label="Reset specialty filter"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.4 }}
        >
          <div
            className={clsx(
              'w-14 h-14 rounded-full text-white/70 ring-1 ring-inset ring-[var(--mid-shade)] mt-1 sm:mt-5 flex items-center justify-center transition-all duration-300 hover:bg-[var(--mid-shade)]/10 active:scale-95 shadow-sm group-hover:scale-105 group-focus:ring-2 group-focus:ring-[var(--mid-shade)]',
              selected === null && 'bg-[var(--mid-shade)] text-white shadow-md scale-105',
              clicked === 'reset' && 'animate-icon-pulse'
            )}
          >
            <XCircle className="w-6 h-6" />
          </div>
          <span className="mt-1 text-xs text-white/90 font-medium text-center">All</span>
        </motion.button>

        {alwaysVisible.map(({ name, label, icon, color }, index) =>
          renderButton(name, label, icon, color, index)
        )}
      </div>

      {/* Expandable section (mobile only) */}
      <AnimatePresence initial={false}>
        {expanded && !isDesktop && (
          <motion.div
            key="expanded-specialties"
            layout
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.33, 0, 0, 1] }}
            className="overflow-hidden"
          >
            <div
              className={clsx(
                'grid grid-cols-4 px-4 sm:grid-cols-5 md:grid-cols-8 gap-y-4 gap-x-3 md:gap-x-2 mt-2'
              )}
            >
              {expandable.map(({ name, label, icon, color }, index) =>
                renderButton(name, label, icon, color, index + 3)
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile toggle with chevron rotation */}
      {!isDesktop && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleToggle}
            className={clsx(
              'text-sm font-medium transition-all flex items-center gap-1',
              expanded ? 'text-[var(--mid-shade)]' : 'text-white/70 hover:underline'
            )}
            aria-expanded={expanded}
          >
            {expanded ? 'Collapse Specialties' : 'See All Specialties'}
            <motion.span
              initial={false}
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              style={{ transformOrigin: '50% 50%' }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.span>
          </button>
        </div>
      )}
    </div>
  );
}
