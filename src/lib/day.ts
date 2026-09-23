/**
 * Timezone-aware "today" boundaries (docs/03-DATABASE.md).
 * Pure functions — no server imports, unit-testable.
 *
 * A "day" is defined in the caller's timezone (?tz=, default UTC):
 * dayStart/dayEnd are UTC instants bracketing local midnight..midnight.
 */

/** True if the string is a valid IANA timezone. */
export function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

const ymdFmt = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Offset of tz at the given instant, in ms (local wall - UTC). */
function offsetMs(tz: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(
    dtf.formatToParts(at).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour === "24" ? "0" : parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** UTC instant of local midnight starting `dateStr` (YYYY-MM-DD) in tz. */
function midnightUtc(dateStr: string, tz: string): Date {
  const guess = new Date(`${dateStr}T00:00:00Z`).getTime();
  // Two refinement passes converge across DST transitions.
  let instant = guess - offsetMs(tz, new Date(guess));
  instant = new Date(`${dateStr}T00:00:00Z`).getTime() - offsetMs(tz, new Date(instant));
  return new Date(instant);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return ymdFmt.format(d);
}

/**
 * Today's [start, end) UTC bounds plus the local date string,
 * for `now` as seen in `tz`.
 */
export function todayBounds(
  tz: string,
  now: Date = new Date(),
): { start: Date; end: Date; date: string } {
  const local = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const date = local.format(now);
  return {
    start: midnightUtc(date, tz),
    end: midnightUtc(addDays(date, 1), tz),
    date,
  };
}

export type DayBound = { date: string; start: Date; end: Date };

/**
 * Last 7 days (today + 6 back) in tz, oldest first.
 * Each day carries its own UTC bounds for bucketing.
 */
export function weekBounds(tz: string, now: Date = new Date()): DayBound[] {
  const today = todayBounds(tz, now);
  const days: DayBound[] = [];
  for (let back = 6; back >= 0; back--) {
    const date = addDays(today.date, -back);
    days.push({
      date,
      start: midnightUtc(date, tz),
      end: midnightUtc(addDays(date, 1), tz),
    });
  }
  return days;
}

/** Local YYYY-MM-DD of an instant in tz (for bucketing rows into days). */
export function localDate(tz: string, at: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}
