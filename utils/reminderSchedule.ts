/**
 * When to send event-reminder emails, computed at purchase time.
 *
 *  - pre-event: 7 days before the event — but only when the ticket was bought at
 *    least 7 days out. Bought later than that, we skip it (the ticket
 *    confirmation email already just went out).
 *  - day-of: ~9:00 AM in the venue timezone (America/New_York) on the event's
 *    date — but only when the ticket was bought more than 48h before the event,
 *    so a last-minute buyer doesn't get a reminder right on top of their
 *    confirmation. For an event that starts before ~11am ET, the 9am slot would
 *    land at/after start, so we fall back to 2h before start.
 *
 * Returns absolute instants (or null to skip). Timezone math is DST-correct via
 * Intl — no dependency needed.
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const SEVEN_DAYS = 7 * DAY;
const FORTY_EIGHT_HOURS = 48 * HOUR;
const TZ = 'America/New_York';
const DAY_OF_HOUR = 9; // 9am local

/** Offset (zone − UTC) in ms at a given instant, e.g. −4h during EDT. */
function tzOffsetMs(instant: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);
  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== 'literal') map[p.type] = p.value;
  let hour = Number(map.hour);
  if (hour === 24) hour = 0; // some runtimes render midnight as "24"
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    hour,
    Number(map.minute),
    Number(map.second)
  );
  return asUTC - instant.getTime();
}

/** The calendar Y/M/D of `instant` as seen in `tz`. */
function zonedDateParts(instant: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== 'literal') map[p.type] = p.value;
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) };
}

/** The UTC instant for a wall-clock time in `tz` (e.g. 9am ET → 13:00Z in EDT). */
function zonedWallTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  tz: string
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute);
  const offset = tzOffsetMs(new Date(utcGuess), tz);
  return new Date(utcGuess - offset);
}

export function computeReminderSchedule(
  purchaseAt: Date,
  eventStart: Date
): { preEventAt: Date | null; dayOfAt: Date | null } {
  const lead = eventStart.getTime() - purchaseAt.getTime();

  const preEventAt =
    lead >= SEVEN_DAYS ? new Date(eventStart.getTime() - SEVEN_DAYS) : null;

  let dayOfAt: Date | null = null;
  if (lead > FORTY_EIGHT_HOURS) {
    const { year, month, day } = zonedDateParts(eventStart, TZ);
    let candidate = zonedWallTimeToUtc(year, month, day, DAY_OF_HOUR, 0, TZ);
    // Event starts at/before the 9am slot → send 2h before start instead.
    if (candidate.getTime() >= eventStart.getTime()) {
      candidate = new Date(eventStart.getTime() - 2 * HOUR);
    }
    // Must still be in the future relative to the purchase.
    if (candidate.getTime() > purchaseAt.getTime()) {
      dayOfAt = candidate;
    }
  }

  return { preEventAt, dayOfAt };
}
