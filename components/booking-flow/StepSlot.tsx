// Refactored StepSlot.tsx
'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useBookingStore } from '@/store/bookingStore';

export default function StepSlot() {
  const {
    selectedDoctor,
    selectedSlot,
    setSelectedSlot,
    setStep,
  } = useBookingStore();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSlots = async (date: Date) => {
    if (!selectedDoctor?._id) return;

    const startDate = format(date, 'yyyy-MM-dd');
    const endDate = format(new Date(date.getTime() + 13 * 86400000), 'yyyy-MM-dd');

    setLoading(true);
    const res = await fetch(
      `/api/heimdall/slots?doctorId=${selectedDoctor._id}&startDate=${startDate}&endDate=${endDate}`
    );

    const data = await res.json();
    if (res.ok && data.slots) {
      setAvailableSlots(
        data.slots.filter((slot: string) => slot.startsWith(startDate))
      );
    } else {
      setAvailableSlots([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [selectedDate, selectedDoctor]);

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
  };

  const proceed = () => {
    if (selectedSlot) setStep(1);
  };

  const formattedDate = format(selectedDate, 'EEEE, MMMM d');
  const formattedTime = selectedSlot ? format(new Date(selectedSlot), 'h:mm a') : null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-3">Select Appointment Date</h2>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={(date) => date && setSelectedDate(date)}
        className="rounded-lg border shadow-sm w-full"
      />

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Available Time Slots</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading slots...</p>
        ) : availableSlots.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {availableSlots.map((slot) => (
              <button
                key={slot}
                onClick={() => handleSlotSelect(slot)}
                className={cn(
                  'px-4 py-2 rounded border text-sm transition-all',
                  selectedSlot === slot
                    ? 'bg-blue-600 text-white animate-pulse'
                    : 'bg-white text-gray-900 hover:bg-gray-100'
                )}
              >
                {format(new Date(slot), 'h:mm a')}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No available slots for this day.</p>
        )}
      </div>

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
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
