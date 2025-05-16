'use client';

import { useBookingStore } from '@/store/bookingStore';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { WeeklyAvailability, BookingStep } from '@/store/bookingStore';

const weekdayMap: Record<number, keyof WeeklyAvailability> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

export default function StepSlot() {
  const {
    availability,
    selectedSlot,
    setSelectedSlot,
    step,
    setStep,
  } = useBookingStore();

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  const weekdayKey = weekdayMap[selectedDate.getDay()];
  const availableSlots: string[] = availability?.[weekdayKey] ?? [];

  const handleSlotSelect = (slot: string) => {
    const fullDateTime = new Date(selectedDate);
    const [hour, minute] = slot.split(':').map(Number);
    fullDateTime.setHours(hour);
    fullDateTime.setMinutes(minute || 0);
    fullDateTime.setSeconds(0);
    setSelectedSlot(fullDateTime.toISOString());
  };

  const proceed = () => {
    if (selectedSlot) setStep((step + 1) as BookingStep);
  };

  const isSelectedSlot = (slot: string) => {
    return selectedSlot?.includes(slot);
  };

  const formattedDate = format(selectedDate, 'EEEE, MMMM d');
  const formattedTime = selectedSlot
    ? format(new Date(selectedSlot), 'h:mm a')
    : null;

  return (
    <div className="space-y-6">
      {/* 📅 Calendar - Always visible */}
      <div>
        <h2 className="text-xl font-semibold mb-3">Select a Date</h2>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          className="rounded-lg border shadow-sm w-full"
        />
      </div>

      {/* 🕒 Time Slots */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Available Time Slots</h2>
        <div className="flex flex-wrap gap-2">
          {availableSlots.length > 0 ? (
            availableSlots.map((slot: string) => (
              <button
                key={slot}
                onClick={() => handleSlotSelect(slot)}
                className={cn(
                  'px-4 py-2 rounded border text-sm transition-all',
                  isSelectedSlot(slot)
                    ? 'bg-blue-600 text-white animate-pulse'
                    : 'bg-white text-gray-900 hover:bg-gray-100'
                )}
              >
                {slot}
              </button>
            ))
          ) : (
            <p className="text-sm text-gray-500">No available slots on this day.</p>
          )}
        </div>
      </div>

      {/* 📋 Summary & Next Button */}
      {selectedSlot && (
        <div className="bg-gray-50 border rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="text-sm">
            <p className="text-gray-700 font-medium">Selected:</p>
            <p className="text-gray-900">{formattedDate} at {formattedTime}</p>
          </div>
          <button
            onClick={proceed}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-all"
          >
            Enter Details
          </button>
        </div>
      )}
    </div>
  );
}