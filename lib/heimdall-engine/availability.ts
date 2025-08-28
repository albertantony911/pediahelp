// lib/heimdall-engine/availability.ts
import { client } from '@/sanity/lib/client';
import { format, eachDayOfInterval } from 'date-fns';

interface GetSlotsParams {
  doctorId: string;
  startDate: string; // "yyyy-MM-dd" in LOCAL (IST) calendar
  endDate: string;   // "yyyy-MM-dd" inclusive by calendar day
}

// ---- IST helpers (no date-fns-tz needed) ----
const IST = '+05:30';

/** Given local date "yyyy-MM-dd" + time "HH:mm", returns the true UTC instant as ISO (Z) */
function istLocalToUtcIso(ymd: string, hhmm: string): string {
  // Example: "2025-01-02T09:00:00+05:30" -> toISOString() -> UTC instant
  return new Date(`${ymd}T${hhmm}:00${IST}`).toISOString();
}

/** Start of local (IST) day rendered as a UTC ISO instant */
function startOfIstDayUtcIso(ymd: string): string {
  return new Date(`${ymd}T00:00:00${IST}`).toISOString();
}

/** Exclusive end of local (IST) day rendered as a UTC ISO instant */
function endOfIstDayExclusiveUtcIso(ymd: string): string {
  const startLocal = new Date(`${ymd}T00:00:00${IST}`);
  const nextLocalMs = startLocal.getTime() + 24 * 60 * 60 * 1000;
  return new Date(nextLocalMs).toISOString();
}

/** 48-hour cutoff in ms */
const MIN_DELAY_MS = 48 * 60 * 60 * 1000;

export async function getAvailableSlots({
  doctorId,
  startDate,
  endDate,
}: GetSlotsParams): Promise<string[]> {
  // Pull appointment control + bookings inside the full local-day range
  const [appointment, bookings] = await Promise.all([
    client.fetch(
      `*[_type == "appointment" && doctor._ref == $doctorId][0]{
        weeklyAvailability,
        overrides
      }`,
      { doctorId }
    ),
    client.fetch(
      `*[_type == "booking"
         && doctor._ref == $doctorId
         && slot >= $startIso
         && slot <  $endIso]{ slot }`,
      {
        doctorId,
        startIso: startOfIstDayUtcIso(startDate),
        endIso: endOfIstDayExclusiveUtcIso(endDate),
      }
    ),
  ]);

  if (!appointment) return [];

  const booked = new Set<string>((bookings || []).map((b: any) => String(b.slot)));
  const out: string[] = [];

  const range = eachDayOfInterval({
    start: new Date(`${startDate}T00:00:00.000Z`),
    end: new Date(`${endDate}T00:00:00.000Z`),
  });

  const cutoff = Date.now() + MIN_DELAY_MS;

  for (const day of range) {
    const dow = format(day, 'EEEE').toLowerCase();  // monday..sunday
    const ymd = format(day, 'yyyy-MM-dd');

    // Base weekly slots (e.g. ["09:00","10:00",...])
    let baseSlots: string[] = appointment?.weeklyAvailability?.[dow] || [];

    // Apply overrides (full-day or partial)
    const dayOverrides = (appointment.overrides || []).filter((o: any) => o.date === ymd);
    if (dayOverrides.length) {
      if (dayOverrides.some((o: any) => o.isFullDay)) {
        // Entire day off
        continue;
      }
      const blocked = new Set<string>(dayOverrides.flatMap((o: any) => o.partialSlots || []));
      baseSlots = baseSlots.filter((s) => !blocked.has(s));
    }

    // Convert each local slot to UTC, enforce 48h buffer, skip booked
    for (const hhmm of baseSlots) {
      const utcIso = istLocalToUtcIso(ymd, hhmm);
      const slotTime = new Date(utcIso).getTime();

      if (slotTime < cutoff) continue;          // 🔒 enforce 48h cutoff
      if (!booked.has(utcIso)) out.push(utcIso);
    }
  }

  return out;
}