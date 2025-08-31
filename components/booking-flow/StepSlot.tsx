'use client';

import React, { useEffect, useState, useMemo, useRef, memo } from 'react';
import { format, parseISO, isSameDay, addDays, startOfMonth } from 'date-fns';
import { useBookingStore } from '@/store/bookingStore';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { tv } from 'tailwind-variants';
import { useButton } from '@react-aria/button';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import debounce from 'lodash.debounce';

// ---- 48h cutoff (mirrors backend) ----
const MIN_DELAY_MS = 48 * 60 * 60 * 1000;
const IST = '+05:30';
const istLocalToUtcMs = (ymd: string, hhmm: string) =>
  new Date(`${ymd}T${hhmm}:00${IST}`).getTime();

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_SIZE_LIMIT = 50;

// Predefined time slots (8:00 AM to 11:00 PM, hourly, 16 slots)
const PREDEFINED_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const hour = 8 + i;
  return `${hour.toString().padStart(2, '0')}:00`;
});

// Booking store slice type
interface BookingStoreSlice {
  selectedDoctor: { _id: string; name?: string; specialty?: string; photo?: { asset?: { url?: string } } } | null;
  selectedSlot: string | null;
  setSelectedSlot: (slot: string | null) => void;
  setStep: (step: number) => void;
}

/* --------------------- Glassmorphism helpers ---------------------- */
const glassWrap =
  'rounded-3xl border border-white/20 bg-white/10 dark:bg-white/5 backdrop-blur-xl shadow-[0_12px_60px_-18px_rgba(0,0,0,0.35)]';
const glassChip =
  'rounded-xl border border-white/15 bg-white/10 dark:bg-white/5 backdrop-blur-xl shadow-[0_2px_16px_-8px_rgba(0,0,0,0.35)]';
const softText = 'text-white';
const softMuted = 'text-white/80';

/* ---------------------- Slot button styles ------------------------ */
const btn = tv({
  base: [
    'relative w-full px-3 py-2.5 rounded-xl cursor-pointer font-semibold text-sm text-center transition-all',
    'outline-none focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-white/15',
    'backdrop-blur-md border will-change-transform-opacity',
  ].join(' '),
  variants: {
    intent: {
      available:
        'bg-white/90 text-dark-shade border-white/80 hover:bg-white hover:shadow-lg hover:-translate-y-[1px] active:translate-y-0 active:shadow-md',
      selected:
        'bg-mid-shade text-white border-teal-300 shadow-[0_20px_44px_-18px_rgba(20,115,110,0.95)]',
      disabled:
        'bg-white/8 text-white/60 border-white/15 opacity-60 cursor-not-allowed',
    },
  },
});

interface SlotButtonProps {
  slot: string;
  selected: boolean;
  available: boolean;
  onSelect: (slot: string) => void;
  index: number;
}

const SlotButton = memo(function SlotButton({ slot, selected, available, onSelect, index }: SlotButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const { buttonProps } = useButton(
    {
      onPress: available ? () => onSelect(slot) : undefined,
      'aria-label': `Select time ${slot}${available ? '' : ', unavailable'}`,
      isDisabled: !available,
    },
    ref
  );
  const { onAnimationStart, onDrag, onDragStart, onDragEnd, ...safeProps } = buttonProps;
  return (
    <motion.button
      ref={ref}
      {...safeProps}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.015, duration: 0.18 }}
      whileHover={available ? { y: -1 } : undefined}
      whileTap={available ? { scale: 0.98 } : undefined}
      className={cn(
        btn({ intent: available ? (selected ? 'selected' : 'available') : 'disabled' }),
        selected && 'ph-ring-lite' // << subtle multi-pulse for selected slot
      )}
      aria-selected={selected}
    >
      {slot}
    </motion.button>
  );
}, (a, b) => a.slot === b.slot && a.selected === b.selected && a.available === b.available && a.index === b.index);

/* ----------------------------- Component ----------------------------- */

export default function StepSlot() {
  const { selectedDoctor, selectedSlot, setSelectedSlot, setStep } = useBookingStore() as unknown as BookingStoreSlice;
  const router = useRouter();

  // Preselect date = today + 2 days
  const initialDate = useMemo(() => addDays(new Date(), 2), []);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [visibleMonth, setVisibleMonth] = useState<Date>(startOfMonth(initialDate));

  const [allFetchedSlots, setAllFetchedSlots] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [noSlots, setNoSlots] = useState(false);
  const slotCache = useRef<Map<string, string[]>>(new Map());
  const autoPickedRef = useRef(false);

  const fetchAllSlots = useMemo(
    () =>
      debounce(async (date: Date, isPreload = false) => {
        if (!selectedDoctor?._id) return;
        const key = format(date, 'yyyy-MM-dd');

        if (slotCache.current.has(key)) {
          const cached = slotCache.current.get(key) || [];
          if (!isPreload) {
            setAvailableSlots(cached);
            setNoSlots(cached.length === 0);
          }
          return;
        }

        if (!isPreload) {
          setLoading(true);
          setNoSlots(false);
        }
        try {
          const startDate = format(date, 'yyyy-MM-dd');
          const endDate = format(new Date(date.getTime() + SEVEN_DAYS_MS), 'yyyy-MM-dd');

          const res = await fetch(
            `/api/heimdall/slots?doctorId=${selectedDoctor._id}&startDate=${startDate}&endDate=${endDate}`
          );
          const data = await res.json();

          if (res.ok && data.slots) {
            const slotsArr = data.slots as string[];
            setAllFetchedSlots((prev) => [...new Set([...prev, ...slotsArr])]);
            const slotsForDay = slotsArr.filter((slot: string) => isSameDay(new Date(slot), date));
            slotCache.current.set(key, slotsForDay);
            if (!isPreload) {
              setAvailableSlots(slotsForDay);
              setNoSlots(slotsForDay.length === 0);
            }

            if (!autoPickedRef.current) {
              const uniqueDays = Array.from(new Set(slotsArr.map((iso) => format(new Date(iso), 'yyyy-MM-dd'))));
              const futureDates: Date[] = uniqueDays.map((d) => parseISO(`${d}T00:00:00Z`));
              futureDates.sort((a, b) => +a - +b);
              const firstAvailable = futureDates.find((d) => d >= addDays(new Date(), 2));
              if (firstAvailable && !isSameDay(firstAvailable, selectedDate)) {
                autoPickedRef.current = true;
                setSelectedDate(firstAvailable);
                setVisibleMonth(startOfMonth(firstAvailable));
              }
            }

            if (slotCache.current.size > CACHE_SIZE_LIMIT) {
              const oldestKey = slotCache.current.keys().next().value;
              if (oldestKey) slotCache.current.delete(oldestKey);
            }
          } else if (!isPreload) {
            setAvailableSlots([]);
            setNoSlots(true);
            toast.error('No slots available');
          }
        } catch {
          if (!isPreload) {
            setAvailableSlots([]);
            setNoSlots(true);
            toast.error('Failed to fetch slots');
          }
        }
        if (!isPreload) setLoading(false);
      }, 150),
    [selectedDoctor, selectedDate]
  );

  useEffect(() => {
    const datesToPreload = [selectedDate, addDays(selectedDate, 1), addDays(selectedDate, 2)];
    datesToPreload.forEach((date) => fetchAllSlots(date, true));
  }, [selectedDoctor, fetchAllSlots, selectedDate]);

  useEffect(() => {
    fetchAllSlots(selectedDate);
    return () => fetchAllSlots.cancel();
  }, [selectedDate, fetchAllSlots]);

  useEffect(() => {
    const handleReconnect = () => fetchAllSlots(selectedDate);
    window.addEventListener('online', handleReconnect);
    return () => window.removeEventListener('online', handleReconnect);
  }, [selectedDate, fetchAllSlots]);

  const handleSlotSelect = (slot: string) => {
    const fullSlot = `${format(selectedDate, 'yyyy-MM-dd')}T${slot}:00`;
    setSelectedSlot(fullSlot);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setVisibleMonth(startOfMonth(date));
  };

  const handleMonthChange = (date: Date) => setVisibleMonth(startOfMonth(date));

  const proceed = () => selectedSlot && setStep(1);
  const cancel = () => router.back();

  const formattedDate = format(selectedDate, 'EEEE, MMMM d');
  const formattedTime = selectedSlot ? format(new Date(selectedSlot), 'h:mm a') : null;
  const photoUrl = selectedDoctor?.photo?.asset?.url || '/doctor-placeholder.jpg';

  const datesWithSlots = useMemo(() => {
    const slotDays = new Set(allFetchedSlots.map((slot) => format(new Date(slot), 'yyyy-MM-dd')));
    return Array.from(slotDays).map((dateStr) => parseISO(`${dateStr}T00:00:00Z`));
  }, [allFetchedSlots]);

  const availableTimesForDay = useMemo(() => {
    const map = new Set<string>();
    availableSlots.forEach((iso) => {
      const d = new Date(iso);
      if (isSameDay(d, selectedDate)) map.add(format(d, 'HH:mm'));
    });
    return map;
  }, [availableSlots, selectedDate]);

  const slotAvailability = useMemo(() => {
    const cutoff = Date.now() + MIN_DELAY_MS;
    const ymd = format(selectedDate, 'yyyy-MM-dd');

    return PREDEFINED_SLOTS.map((time) => {
      const exists = availableTimesForDay.has(time);
      const utcMs = istLocalToUtcMs(ymd, time);
      const farEnough = utcMs >= cutoff;
      return { time, available: exists && farEnough };
    });
  }, [availableTimesForDay, selectedDate]);

  const monthKey = `${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}`;

  return (
    <>
      {/* background wash */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-80"
        style={{
          background:
            'radial-gradient(62rem 62rem at 18% -12%, rgba(202,215,110,0.18), transparent 60%), ' +
            'radial-gradient(52rem 52rem at 90% 10%, rgba(28,148,123,0.20), transparent 60%)',
        }}
      />

      {/* ONE glass panel for all three sections */}
      <div className={cn(glassWrap, 'w-full mx-auto px-4 sm:px-6 py-5 text-white')}>
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Calendar (wrapper sizes to content) */}
            <section aria-label="Select appointment date" className="md:justify-self-start">
              <motion.div
                key={monthKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className={cn(glassChip, 'p-4 inline-block w-auto mx-auto md:mx-0')}
              >
                <DayPicker
                  className="rdp-custom"
                  mode="single"
                  month={visibleMonth}
                  onMonthChange={handleMonthChange}
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  weekStartsOn={1}
                  modifiers={{
                    available: datesWithSlots,
                    disabled: { before: addDays(new Date(), 2) },
                    today: new Date(),
                  }}
                  classNames={{
                    root: 'text-sm sm:text-base md:text-lg ' + softText,
                    caption: 'relative flex justify-center items-center font-semibold text-base sm:text-lg md:text-xl gap-2 mb-7',
                    nav: 'flex justify-between w-full absolute top-1',
                    nav_button: 'p-1 sm:p-2 md:p-3 rounded-full hover:bg-teal-300/25 active:bg-teal-300/35 transition',
                    head: 'mb-4',
                    head_cell: 'text-xs sm:text-sm md:text-base ' + softMuted,
                    table: 'w-full',
                    tbody: 'rounded-2xl overflow-hidden',
                    day: [
                      'rounded-full w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16',
                      'flex items-center justify-center text-base sm:text-lg md:text-xl',
                      'transition will-change-transform focus-visible:outline-none',
                      'ph-day-selected-ring-base', // keeps relative context for rings
                    ].join(' '),
                  }}
                  components={{
                    IconLeft: () => <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white/90" />,
                    IconRight: () => <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white/90" />,
                  }}
                  captionLayout="dropdown-buttons"
                  aria-label="Appointment calendar"
                />
              </motion.div>
            </section>

            {/* Slots + Summary stacked (right column) */}
            <section className="flex flex-col gap-6">
              {/* Slots */}
              <div className={cn(glassChip, 'p-4 relative')} aria-label="Select appointment time">
                <div className="flex items-center justify-center mb-3">
                  <h4 className="text-sm font-semibold text-center text-white/95">SELECT FROM AVAILABLE SLOTS</h4>
                </div>

                {/* Unified overlay (fade) */}
                <div
                  className={cn(
                    'absolute inset-0 rounded-xl overflow-hidden z-10 ph-overlay',
                    !(loading || noSlots) && 'pointer-events-none opacity-0'
                  )}
                >
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                  <div className="relative z-10 h-full flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      {loading ? (
                        <>
                          <span className="ph-spinner-lite" aria-hidden />
                          <span className="text-xs text-white/90 tracking-wide ph-breathe">Updating slots…</span>
                        </>
                      ) : noSlots ? (
                        <>
                          <span className="ph-ghost-lite" aria-hidden />
                          <span className="text-xs text-white/90 tracking-wide ph-breathe">No slots for this date</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>

                <motion.div
                  key={selectedDate.toISOString()}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-4 gap-3"
                  aria-busy={loading}
                >
                  {slotAvailability.map((slot, index) => (
                    <SlotButton
                      key={slot.time}
                      slot={slot.time}
                      selected={
                        !!selectedSlot &&
                        isSameDay(new Date(selectedSlot), selectedDate) &&
                        format(new Date(selectedSlot), 'HH:mm') === slot.time
                      }
                      available={slot.available}
                      onSelect={handleSlotSelect}
                      index={index}
                    />
                  ))}
                </motion.div>
              </div>

              {/* Summary (always mounted to avoid layout shift) */}
              {/* Summary (always mounted to avoid layout shift) */}
<div
  className={cn(
    glassChip,
    'p-4 transition-opacity duration-300 max-w-full w-full sm:w-[calc(4*11rem+3*0.75rem+2*1rem)] md:w-[calc(4*12rem+3*0.75rem+2*1rem)]',
    !selectedSlot && 'opacity-60'
  )}
  aria-label="Your appointment selection"
  aria-live="polite"
>
  <div className="flex items-start gap-4">
    <motion.img
      initial={{ opacity: 0.85 }}
      animate={{ opacity: selectedSlot ? 1 : 0.85 }}
      transition={{ duration: 0.18 }}
      src={photoUrl}
      alt={selectedDoctor?.name || 'Doctor photo'}
      className="w-[70px] h-[90px] sm:w-[64px] sm:h-[88px] md:w-[72px] md:h-[96px] rounded-2xl object-cover border border-white/30 shadow shrink-0"
      style={{ aspectRatio: '3 / 4' }}
    />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 text-sm md:text-base">
        <span
          className="font-semibold uppercase"
          title={selectedDoctor?.name || 'Doctor Name'}
        >
          {(selectedDoctor?.name || 'Doctor Name').length > 17
            ? `${(selectedDoctor?.name || 'Doctor Name').slice(0, 17)}...`
            : selectedDoctor?.name || 'Doctor Name'}
        </span>
        {selectedDoctor?.specialty && (
          <span
            className="text-xs md:text-sm text-white/70 truncate max-w-[60px] sm:max-w-[150px] md:max-w-[180px]"
            title={selectedDoctor.specialty}
          >
            {selectedDoctor.specialty}
          </span>
        )}
      </div>
      <div className="mt-1 text-xs md:text-sm uppercase text-white/90">
        {selectedSlot ? (
          <>
            {formattedDate}, {formattedTime}
          </>
        ) : (
          <span className="text-white/60">Choose a date and time</span>
        )}
      </div>

      <div className="mt-3 flex flex-row gap-3">
        <button
          type="button"
          onClick={cancel}
          className="w-1/3 text-sm font-medium cursor-pointer text-white/95 py-2 px-4 rounded-xl border border-white/25 bg-white/10 hover:bg-white/20 transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={proceed}
          disabled={!selectedSlot}
          className={cn(
            'w-full text-sm font-semibold rounded-xl py-2 px-4 transition text-white relative overflow-hidden',
            'bg-mid-shade hover:bg-dark-shade cursor-pointer border border-white/25 shadow-[0_18px_40px_-18px_rgba(20,115,110,0.8)]',
            !selectedSlot && 'opacity-60 cursor-not-allowed'
          )}
        >
          Continue
        </button>
      </div>
    </div>
  </div>
</div>
            </section>
          </div>
        </div>
      </div>

      {/* ==== Subtle multi-pulse rings + DayPicker overrides ==== */}
      <style jsx global>{`
        /* Overlay fade (smoother) */
        .ph-overlay { transition: opacity .25s ease; }

        /* Spinner (lighter, smoother) */
        .ph-spinner-lite {
          width: 16px; height: 16px; border-radius: 9999px;
          border: 2px solid rgba(255,255,255,0.22);
          border-top-color: rgba(255,255,255,0.95);
          animation: ph_spin .75s linear infinite;
        }
        @keyframes ph_spin { to { transform: rotate(360deg); } }

        /* Gentle breathing for status text */
        .ph-breathe { animation: ph_breathe 1.8s ease-in-out infinite; }
        @keyframes ph_breathe { 0%,100% { opacity: .75 } 50% { opacity: 1 } }

        /* Minimal ghost block for "no slots" */
        .ph-ghost-lite {
          width: 16px; height: 16px; border-radius: 5px;
          background: linear-gradient(180deg, rgba(255,255,255,.38), rgba(255,255,255,.08));
          opacity: .85;
        }

        /* ===== Subtle multi-pulse for selected elements ===== */

        /* Small ring keyframes (two different timings) */
        @keyframes ph_ringSmallA {
          0% { opacity: .7; box-shadow: 0 0 0 0 rgba(255,255,255,.55); }
          70% { opacity: 0; box-shadow: 0 0 0 6px rgba(255,255,255,0); }
          100% { opacity: 0; box-shadow: 0 0 0 6px rgba(255,255,255,0); }
        }
        @keyframes ph_ringSmallB {
          0% { opacity: .4; box-shadow: 0 0 0 0 rgba(255,255,255,.45); }
          70% { opacity: 0; box-shadow: 0 0 0 10px rgba(255,255,255,0); }
          100% { opacity: 0; box-shadow: 0 0 0 10px rgba(255,255,255,0); }
        }

        /* Slot button multi-pulse (very subtle, no scale) */
        .ph-ring-lite { position: relative; z-index: 0; }
        .ph-ring-lite::before,
        .ph-ring-lite::after {
          content: "";
          position: absolute;
          inset: -1px;
          border-radius: 12px;
          pointer-events: none;
          z-index: -1;
        }
        .ph-ring-lite::before {
          animation: ph_ringSmallA 2.2s ease-out infinite;
        }
        .ph-ring-lite::after {
          animation: ph_ringSmallB 3s ease-out infinite .6s;
        }

        /* DayPicker base */
        .rdp-custom .rdp-day {
          position: relative;
          transition: background-color .15s ease, color .15s ease, box-shadow .15s ease;
          border-radius: 9999px;
          line-height: 1;
        }

        /* Hover (available, not selected/disabled) — light gray wash */
        .rdp-custom .rdp-day:not(.rdp-day_selected):not(.rdp-day_disabled):not([disabled]):hover,
        .rdp-custom .rdp-button:not(.rdp-day_selected):not(.rdp-day_disabled):not([disabled]):hover {
          background-color: rgba(255,255,255,0.22) !important;
          color: #ffffff !important;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25);
        }

        /* Selected day bubble (solid, no scale) with subtle dual ring */
        .rdp-custom .rdp-day.rdp-day_selected,
        .rdp-custom .rdp-button.rdp-day_selected {
          background-color: rgba(20,184,166,0.85) !important;
          color: #ffffff !important;
          font-weight: 700;
        }
        .rdp-custom .rdp-day.rdp-day_selected:hover,
        .rdp-custom .rdp-button.rdp-day_selected:hover {
          background-color: rgba(13,148,136,0.9) !important;
        }
        .rdp-custom .rdp-day.rdp-day_selected::before,
        .rdp-custom .rdp-day.rdp-day_selected::after,
        .rdp-custom .rdp-button.rdp-day_selected::before,
        .rdp-custom .rdp-button.rdp-day_selected::after {
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 9999px;
          pointer-events: none;
        }
        .rdp-custom .rdp-day.rdp-day_selected::before,
        .rdp-custom .rdp-button.rdp-day_selected::before {
          animation: ph_ringSmallA 2.2s ease-out infinite;
        }
        .rdp-custom .rdp-day.rdp-day_selected::after,
        .rdp-custom .rdp-button.rdp-day_selected::after {
          animation: ph_ringSmallB 3s ease-out infinite .6s;
        }
        .rdp-custom .rdp-day.rdp-day_selected > * { position: relative; z-index: 1; }

        /* Today (not selected) */
        .rdp-custom .rdp-day_today:not(.rdp-day_selected),
        .rdp-custom .rdp-button.rdp-day_today:not(.rdp-day_selected) {
          background-color: rgba(255,255,255,0.08);
          color: #e2e8f0;
          font-weight: 600;
        }

        /* Disabled */
        .rdp-custom .rdp-day[disabled],
        .rdp-custom .rdp-day_disabled,
        .rdp-custom .rdp-button[disabled] {
          color: rgba(255,255,255,0.28) !important;
          background-color: transparent !important;
          cursor: not-allowed !important;
        }
        .rdp-custom .rdp-day[disabled]:hover,
        .rdp-custom .rdp-day_disabled:hover,
        .rdp-custom .rdp-button[disabled]:hover {
          background-color: transparent !important;
          color: rgba(255,255,255,0.28) !important;
          box-shadow: none !important;
        }

        .rdp-custom .rdp-caption { margin-bottom: 1.25rem; }

        /* Reduce motion */
        @media (prefers-reduced-motion: reduce) {
          .ph-ring-lite::before,
          .ph-ring-lite::after,
          .rdp-custom .rdp-day.rdp-day_selected::before,
          .rdp-custom .rdp-day.rdp-day_selected::after,
          .ph-spinner-lite,
          .ph-breathe { animation: none !important; }
        }
      `}</style>
    </>
  );
}