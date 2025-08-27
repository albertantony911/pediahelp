'use client';

import { motion } from 'framer-motion';

const STEPS = ['Select Slot', 'Details & OTP', 'Confirmation'];

export default function Stepper({ step }: { step: 0 | 1 | 2 }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-center gap-3 text-xs">
        {STEPS.map((label, i) => {
          const state = i < step ? 'done' : i === step ? 'current' : 'upcoming';
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="relative flex items-center justify-center">
                {state === 'current' && (
                  <motion.span
                    className="absolute inline-block h-5 w-5 rounded-full bg-white/25 blur-sm"
                    initial={{ opacity: 0.3, scale: 0.9 }}
                    animate={{ opacity: [0.6, 0.3, 0.6], scale: [1, 1.14, 1] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                    aria-hidden
                  />
                )}
                <div
                  className={[
                    'h-2.5 w-2.5 rounded-full relative z-10 transition-all',
                    state === 'done'
                      ? 'bg-white ring-4 ring-white/30'
                      : state === 'current'
                      ? 'bg-white ring-4 ring-white/15'
                      : 'bg-gray-300 dark:bg-gray-700',
                  ].join(' ')}
                />
              </div>
              <span
                className={[
                  'transition-colors',
                  state === 'done'
                    ? 'text-white font-medium'
                    : state === 'current'
                    ? 'text-white font-semibold'
                    : 'text-gray-400 dark:text-gray-500',
                ].join(' ')}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className="w-8 h-px bg-gradient-to-r from-transparent via-gray-300/60 to-transparent dark:via-gray-700/60" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}