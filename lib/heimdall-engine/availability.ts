import { client } from '@/sanity/lib/client';
import { format, isWithinInterval, parse, eachDayOfInterval } from 'date-fns';

interface GetSlotsParams {
  doctorId: string;
  startDate: string; // ISO string
  endDate: string;   // ISO string
}

export async function getAvailableSlots({ doctorId, startDate, endDate }: GetSlotsParams): Promise<string[]> {
  const range = eachDayOfInterval({
    start: new Date(startDate),
    end: new Date(endDate),
  });

  const [availability, leaves, bookings] = await Promise.all([
    client.fetch(`*[_type == "availability" && doctor._ref == $doctorId][0]`, { doctorId }),
    client.fetch(`*[_type == "leave" && doctor._ref == $doctorId && date >= $startDate && date <= $endDate]`, {
      doctorId,
      startDate,
      endDate,
    }),
    client.fetch(`*[_type == "booking" && doctor._ref == $doctorId && slot >= $startDate && slot <= $endDate]`, {
      doctorId,
      startDate,
      endDate,
    }),
  ]);

  const bookedSlots = new Set(bookings.map((b: any) => b.slot));

  const result: string[] = [];

  for (const day of range) {
    const dayOfWeek = format(day, 'EEEE').toLowerCase(); // e.g. "monday"
    const dateStr = format(day, 'yyyy-MM-dd');

    const isLeave = leaves.find((leave: any) => leave.date === dateStr);

    // skip full day leave
    if (isLeave?.isFullDay) continue;

    // determine base slot list
    const baseSlots: string[] = availability?.[dayOfWeek] ?? [];

    // if partial leave: filter out excluded time slots
    const blocked = isLeave?.partialLeaveSlots ?? [];

    for (const slot of baseSlots) {
      if (blocked.includes(slot)) continue;

      const slotISO = new Date(`${dateStr}T${slot}:00+05:30`).toISOString(); // IST for now

      if (!bookedSlots.has(slotISO)) {
        result.push(slotISO);
      }
    }
  }

  return result;
}