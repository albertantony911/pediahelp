'use client';

import React, { useEffect, useState, useMemo, useRef, memo } from 'react';
import { format, parseISO, isSameDay, addDays } from 'date-fns';
import { useBookingStore } from '@/store/bookingStore';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { tv } from 'tailwind-variants';
import { useButton } from '@react-aria/button';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import debounce from 'lodash.debounce';

// Constants
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const CACHE_SIZE_LIMIT = 50;

// Predefined time slots (8:00 AM to 11:00 PM, hourly, 16 slots)
const PREDEFINED_SLOTS = Array.from({ length: 16 }, (_, i) => {
  const hour = 8 + i;
  return `${hour.toString().padStart(2, '0')}:00`;
});


// Types
interface BookingStore {
  selectedDoctor: { _id: string; name?: string; photo?: { asset?: { url?: string } } } | null;
  selectedSlot: string | null;
  setSelectedSlot: (slot: string | null) => void;
  setStep: (step: number) => void;
}

// Tailwind Variants for button styles
const buttonStyles = tv({
  base: 'relative w-full px-3 py-2.5 rounded-lg font-medium text-sm text-center transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 will-change-transform-opacity',
  variants: {
    intent: {
      available: 'bg-teal-200 text-dark-shade border border-teal-400 hover:border-teal-500 hover:bg-teal-100',
      selected: 'bg-teal-600 text-white ring-2 ring-coral-400 scale-[1.05] animate-pulse-ring',
      disabled: 'bg-gray-600 text-gray-400 opacity-50 cursor-not-allowed border border-dashed border-gray-300',
    },
  },
});

// Custom CSS for subtle pulse ring animation (slots only)
const pulseRingStyles = `
@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.5); }
  70% { box-shadow: 0 0 0 6px rgba(248, 113, 113, 0); }
  100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0); }
}
.animate-pulse-ring {
  animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
.will-change-transform-opacity {
  will-change: transform, opacity;
}
`;

// Slot Button Component
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.015, duration: 0.15 }}
      className={cn(
        buttonStyles({ intent: available ? (selected ? 'selected' : 'available') : 'disabled' })
      )}
      aria-selected={selected}
    >
      {slot}
    </motion.button>
  );
}, (prevProps, nextProps) => (
  prevProps.slot === nextProps.slot &&
  prevProps.selected === nextProps.selected &&
  prevProps.available === nextProps.available &&
  prevProps.index === nextProps.index
));

export default function StepSlot() {
  const { selectedDoctor, selectedSlot, setSelectedSlot, setStep } = useBookingStore() as BookingStore;
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [monthKey, setMonthKey] = useState<number>(selectedDate.getMonth());
  const [allFetchedSlots, setAllFetchedSlots] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const slotCache = useRef<Map<string, string[]>>(new Map());

  const fetchAllSlots = useMemo(
    () =>
      debounce(async (date: Date, isPreload = false) => {
        if (!selectedDoctor?._id) return;
        const key = format(date, 'yyyy-MM-dd');

        if (slotCache.current.has(key)) {
          if (!isPreload) setAvailableSlots(slotCache.current.get(key) || []);
          return;
        }

        if (!isPreload) setLoading(true);
        try {
          const startDate = format(date, 'yyyy-MM-dd');
          const endDate = format(new Date(date.getTime() + SEVEN_DAYS_MS), 'yyyy-MM-dd');

          const res = await fetch(
            `/api/heimdall/slots?doctorId=${selectedDoctor._id}&startDate=${startDate}&endDate=${endDate}`
          );
          const data = await res.json();

          if (res.ok && data.slots) {
            setAllFetchedSlots((prev) => [...new Set([...prev, ...data.slots])]);
            const slotsForDay = data.slots.filter((slot: string) => isSameDay(new Date(slot), date));
            slotCache.current.set(key, slotsForDay);
            if (!isPreload) setAvailableSlots(slotsForDay);

            if (slotCache.current.size > CACHE_SIZE_LIMIT) {
              const oldestKey = slotCache.current.keys().next().value;
              if (oldestKey) {
                slotCache.current.delete(oldestKey);
              }
            }
          } else if (!isPreload) {
            setAvailableSlots([]);
            toast.error('No slots available');
          }
        } catch {
          if (!isPreload) toast.error('Failed to fetch slots');
        }
        if (!isPreload) setLoading(false);
      }, 150),
    [selectedDoctor]
  );

  // Preload slots for next 3 days
  useEffect(() => {
    const datesToPreload = [selectedDate, addDays(selectedDate, 1), addDays(selectedDate, 2)];
    datesToPreload.forEach((date) => fetchAllSlots(date, true));
  }, [selectedDoctor, fetchAllSlots]);

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

  const proceed = () => selectedSlot && setStep(1);
  const goBack = () => router.back();

  const formattedDate = format(selectedDate, 'EEEE, MMMM d');
  const formattedTime = selectedSlot ? format(new Date(selectedSlot), 'h:mm a') : null;
  const photoUrl = selectedDoctor?.photo?.asset?.url || '/doctor-placeholder.jpg';

  const datesWithSlots = useMemo(() => {
    const slotDays = new Set(allFetchedSlots.map((slot) => format(new Date(slot), 'yyyy-MM-dd')));
    return Array.from(slotDays).map((dateStr) => parseISO(`${dateStr}T00:00:00Z`));
  }, [allFetchedSlots]);

  const slotAvailability = useMemo(() => {
    return PREDEFINED_SLOTS.map((time) => ({
      time,
      available: availableSlots.some(
        (slot) => isSameDay(new Date(slot), selectedDate) && format(new Date(slot), 'HH:mm') === time
      ),
    }));
  }, [availableSlots, selectedDate]);

  return (
    <>
      <style>{pulseRingStyles}</style>
      <div className="w-full mx-auto px-4 sm:px-6 ">
        <div className="flex flex-col justify-center md:gap-12">
          {/* Calendar Section */}
          <section className="md:w-auto mx-auto" aria-label="Select appointment date">
            <AnimatePresence mode="wait">
              <motion.div
                key={monthKey}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  onMonthChange={(date) => setMonthKey(date.getMonth())}
                  weekStartsOn={1}
                  modifiers={{ available: datesWithSlots }}
                  modifiersClassNames={{
                    selected: 'bg-teal-100 text-dark-shade scale-[1.05] transition-all duration-300 ease-in-out',
                    today: 'text-coral-600 font-semibold',
                    available: 'border border-coral-400 hover:bg-teal-50 hover:scale-[1.03] transition-all duration-200 ease-in-out',
                  }}
                  className="rounded-xl border border-gray-200 p-4 shadow-sm bg-white text-sm"
                  components={{
                    IconLeft: () => <ChevronLeft className="w-4 h-4 text-gray-500 hover:text-teal-600" />,
                    IconRight: () => <ChevronRight className="w-4 h-4 text-gray-500 hover:text-teal-600" />,
                  }}
                  classNames={{
                    caption: 'relative flex justify-center items-center font-semibold text-sm gap-2 mb-2',
                    nav: 'flex justify-between w-full absolute top-1',
                    nav_button: 'p-1',
                  }}
                  captionLayout="dropdown-buttons"
                  aria-label="Appointment calendar"
                />
              </motion.div>
            </AnimatePresence>
          </section>

          {/* Time Slots Section */}
          <section className="md:w-lg mx-auto mt-6 md:mt-0 relative" aria-label="Select appointment time">
            <div className="block md:hidden text-center text-sm font-semibold text-white mb-2">
              Available Slots
            </div>
            {loading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                <div className="text-sm text-white animate-pulse">Updating slots...</div>
              </div>
            )}
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedDate.toISOString()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0 } }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-4  gap-3"
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
            </AnimatePresence>
          </section>
        </div>

        {/* Summary Card */}
        {selectedSlot && (
          <section
            className="mt-6 mx-auto max-w-2xl bg-white rounded-2 border border-gray-100 shadow-md p-4"
            aria-label="Your appointment selection"
            aria-live="polite"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <img
                  src={photoUrl}
                  alt={selectedDoctor?.name || 'Doctor photo'}
                  className="w-14 h-14 rounded-xl object-cover border"
                />
                <div className="flex flex-col text-sm">
                  <span className="font-semibold text-gray-800">{selectedDoctor?.name || 'Doctor Name'}</span>
                  <span className="text-teal-700 font-medium">{formattedDate} at {formattedTime}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <button
                  type="button"
                  onClick={goBack}
                  className="col-span-1 text-sm font-medium text-gray-600 border border-gray-300 rounded-md py-2 px-4 hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={proceed}
                  className="col-span-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md py-2 px-4"
                >
                  Continue
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}