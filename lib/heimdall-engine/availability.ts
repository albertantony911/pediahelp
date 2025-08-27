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

/**
 * Given a local date string "yyyy-MM-dd" and time "HH:mm",
 * returns the true UTC instant as ISO string using IST offset.
 */
function istLocalToUtcIso(ymd: string, hhmm: string): string {
  // Example: "2025-01-02T09:00:00+05:30" -> toISOString() -> UTC instant
  return new Date(`${ymd}T${hhmm}:00${IST}`).toISOString();
}

/**
 * Start of local (IST) day as a UTC ISO string.
 * "2025-01-02" -> "2025-01-01T18:30:00.000Z" (depending on DST-none for IST)
 */
function startOfIstDayUtcIso(ymd: string): string {
  return new Date(`${ymd}T00:00:00${IST}`).toISOString();
}

/**
 * Exclusive end of local (IST) day as a UTC ISO string.
 * "2025-01-02" -> next day 00:00 IST -> UTC ISO
 */
function endOfIstDayExclusiveUtcIso(ymd: string): string {
  // Compute next local day 00:00 IST by adding 24h to the local instant, then toISOString
  const startLocal = new Date(`${ymd}T00:00:00${IST}`); // local instant with +05:30 suffix
  const nextLocalMs = startLocal.getTime() + 24 * 60 * 60 * 1000;
  return new Date(nextLocalMs).toISOString();
}

export async function getAvailableSlots({
  doctorId,
  startDate,
  endDate,
}: GetSlotsParams): Promise<string[]> {
  // Fetch appointment control + bookings within the full local-day range
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

  // Build the local (calendar) range; we only use y-m-d from these dates
  const range = eachDayOfInterval({
    start: new Date(`${startDate}T00:00:00.000Z`), // just a container date; we’ll format y-m-d
    end: new Date(`${endDate}T00:00:00.000Z`),
  });

  for (const day of range) {
    const dow = format(day, 'EEEE').toLowerCase();  // monday..sunday
    const ymd = format(day, 'yyyy-MM-dd');          // local calendar date string

    // Base weekly slots (e.g. ["09:00","10:00",...])
    let baseSlots: string[] = appointment?.weeklyAvailability?.[dow] || [];

    // Apply overrides
    const dayOverrides = (appointment.overrides || []).filter((o: any) => o.date === ymd);
    if (dayOverrides.length) {
      if (dayOverrides.some((o: any) => o.isFullDay)) {
        // Entire day off
        continue;
      }
      const blocked = new Set<string>(dayOverrides.flatMap((o: any) => o.partialSlots || []));
      baseSlots = baseSlots.filter((s) => !blocked.has(s));
    }

    // Convert each local slot to the true UTC instant, skip if already booked
    for (const hhmm of baseSlots) {
      const utcIso = istLocalToUtcIso(ymd, hhmm);
      if (!booked.has(utcIso)) out.push(utcIso);
    }
  }

  return out;
}