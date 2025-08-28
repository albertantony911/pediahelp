// lib/heimdall-engine/availability.ts
import { client } from '@/sanity/lib/client';
import { format, eachDayOfInterval, compareAsc } from 'date-fns';

interface GetSlotsParams {
  doctorId: string;
  startDate: string; // "yyyy-MM-dd" in LOCAL (IST) calendar
  endDate: string;   // "yyyy-MM-dd" inclusive by calendar day
}

/* --------------------------- IST helpers --------------------------- */

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

/* ----------------------- Slot sanitation helpers ----------------------- */

const HHMM_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

/** "9:0" -> "09:00", "9:30"->"09:30"; returns null if invalid */
function normalizeSlot(hhmm: unknown): string | null {
  if (typeof hhmm !== 'string') return null;
  const trimmed = hhmm.trim();
  // Allow a few loose patterns and reformat to HH:mm
  const m = /^(\d{1,2}):(\d{1,2})$/.exec(trimmed);
  if (!m) return HHMM_RE.test(trimmed) ? trimmed : null;

  let h = Number(m[1]);
  let min = Number(m[2]);
  if (isNaN(h) || isNaN(min) || h < 0 || h > 23 || min < 0 || min > 59) return null;

  const out = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  return HHMM_RE.test(out) ? out : null;
}

/** Ensure an array of strings, normalized and unique */
function normalizeSlotArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  for (const v of arr) {
    const n = normalizeSlot(v);
    if (n) seen.add(n);
  }
  return Array.from(seen);
}

/* ------------------------------ Main ------------------------------ */

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

  const weekly = appointment.weeklyAvailability ?? {};
  const overrides: any[] = Array.isArray(appointment.overrides) ? appointment.overrides : [];
  const booked = new Set<string>((bookings || []).map((b: any) => String(b.slot)));

  const outIso: string[] = [];
  const cutoff = Date.now() + MIN_DELAY_MS;

  // Build the local (calendar) range; we only use y-m-d
  const range = eachDayOfInterval({
    start: new Date(`${startDate}T00:00:00.000Z`),
    end: new Date(`${endDate}T00:00:00.000Z`),
  });

  for (const day of range) {
    const dow = format(day, 'EEEE').toLowerCase(); // monday..sunday
    const ymd = format(day, 'yyyy-MM-dd');

    // Base weekly slots
    const baseRaw = weekly?.[dow];
    let baseSlots = normalizeSlotArray(baseRaw);

    if (!baseSlots.length) continue;

    // Apply same-day overrides
    const dayOverrides = overrides.filter((o) => o?.date === ymd);
    if (dayOverrides.length) {
      // Full day off?
      if (dayOverrides.some((o) => o?.isFullDay)) continue;

      // Partial blocks
      const blocked = new Set<string>();
      for (const ov of dayOverrides) {
        normalizeSlotArray(ov?.partialSlots).forEach((s) => blocked.add(s));
      }
      baseSlots = baseSlots.filter((s) => !blocked.has(s));
      if (!baseSlots.length) continue;
    }

    // Convert each local slot to UTC, enforce 48h buffer, skip booked
    for (const hhmm of baseSlots) {
      const utcIso = istLocalToUtcIso(ymd, hhmm);
      const slotMs = new Date(utcIso).getTime();
      if (slotMs < cutoff) continue; // 48h guard
      if (!booked.has(utcIso)) outIso.push(utcIso);
    }
  }

  // Deduplicate + sort ascending
  const unique = Array.from(new Set(outIso));
  unique.sort((a, b) => compareAsc(new Date(a), new Date(b)));
  return unique;
}