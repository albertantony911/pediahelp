// lib/heimdall-engine/availability.ts
import { client } from '@/sanity/lib/client';
import { format, eachDayOfInterval } from 'date-fns';

interface GetSlotsParams {
  doctorId: string;
  startDate: string; // "yyyy-MM-dd"
  endDate: string;   // "yyyy-MM-dd"
  // (optional later) timezone?: string; // e.g. "Asia/Kolkata"
}

// Helper: force an ISO range covering the whole day in UTC
function dayStartIso(dateStr: string) {
  // 00:00:00.000Z of that calendar day
  return `${dateStr}T00:00:00.000Z`;
}
function dayEndExclusiveIso(dateStr: string) {
  // next day 00:00:00.000Z (exclusive upper bound)
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  const next = new Date(d.getTime() + 24 * 60 * 60 * 1000);
  return next.toISOString();
}

export async function getAvailableSlots({ doctorId, startDate, endDate }: GetSlotsParams): Promise<string[]> {
  // Build a UTC day-by-day loop range
  const range = eachDayOfInterval({
    start: new Date(`${startDate}T00:00:00.000Z`),
    end: new Date(`${endDate}T00:00:00.000Z`),
  });

  // Fetch base data (no time filtering for availability;
  // leaves & bookings filtered with explicit ISO bounds)
  const [availability, leaves, bookings] = await Promise.all([
    client.fetch(`*[_type == "availability" && doctor._ref == $doctorId][0]`, { doctorId }),
    client.fetch(
      `*[_type == "leave" && doctor._ref == $doctorId && date >= $startDate && date <= $endDate]`,
      { doctorId, startDate, endDate }
    ),
    client.fetch(
      `*[_type == "booking" && doctor._ref == $doctorId && slot >= $startIso && slot < $endIso]`,
      {
        doctorId,
        startIso: dayStartIso(startDate),
        endIso: dayEndExclusiveIso(endDate),
      }
    ),
  ]);

  const bookedSlots = new Set((bookings || []).map((b: any) => b.slot as string));
  const result: string[] = [];

  for (const day of range) {
    const dayOfWeek = format(day, 'EEEE').toLowerCase(); // "monday"
    const dateStr = format(day, 'yyyy-MM-dd');

    // check leave record for this day (assumes leave.date is stored as "yyyy-MM-dd")
    const todaysLeave = (leaves || []).find((leave: any) => leave.date === dateStr);

    if (todaysLeave?.isFullDay) continue;

    // doctor weekly availability for the weekday
    const baseSlots: string[] = (availability?.[dayOfWeek] ?? []).map((s: string) => s.trim());

    // partial leave blocks (array like ["09:00","10:00"])
    const blocked = todaysLeave?.partialLeaveSlots ?? [];

    for (const slot of baseSlots) {
      if (blocked.includes(slot)) continue;

      // Build an ISO in UTC that represents this local time slot.
      // If you want IST specifically, keep +05:30 and convert to UTC:
      // new Date(`${dateStr}T${slot}:00+05:30`).toISOString()
      //
      // For now, assume you store/fetch everything in UTC:
      const slotIso = `${dateStr}T${slot}:00.000Z`;

      if (!bookedSlots.has(slotIso)) {
        result.push(slotIso);
      }
    }
  }

  return result;
}