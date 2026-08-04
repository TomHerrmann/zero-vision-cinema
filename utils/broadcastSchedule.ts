/**
 * Which events are due a broadcast on a given morning, in the venue timezone
 * (America/New_York). The daily 9am ET schedule asks for two windows:
 *
 *  - offset 0 → events happening today          → the "reminder" broadcast
 *  - offset 6 → events happening in 6 days      → the "announcement" broadcast
 *
 * `datetime` is a timestamptz, so selecting "events on an ET calendar day" means
 * converting that day's local midnight boundaries to UTC — which shifts by an
 * hour across DST. Done via Intl, so no date library is needed.
 *
 * This replaced a per-event `notBefore` schedule computed at event-creation
 * time: QStash rejects delays beyond 7 days (`maxDelay ... 604800`), so an
 * announcement 6 days ahead of an event could only ever be scheduled for events
 * created inside a 7-day horizon. Asking each morning has no such limit.
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const TZ = 'America/New_York';
export const ANNOUNCE_DAYS_BEFORE = 6;

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
  if (hour === 24) hour = 0;
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

function zonedDateParts(instant: Date, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);
  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== 'literal') map[p.type] = p.value;
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
  };
}

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

/**
 * UTC bounds of the ET calendar day `daysFromNow` days after `now`, as a
 * half-open range: `start` inclusive, `end` exclusive. `daysFromNow: 0` is
 * today in ET, `6` is the day six days out.
 *
 * Both edges are resolved independently, so a window spanning a DST transition
 * is 23 or 25 hours wide rather than a naive 24 — which is what keeps an event
 * at 11pm on the night the clocks change from falling outside its own day.
 */
export function etDayRangeUtc(
  now: Date,
  daysFromNow: number
): { start: Date; end: Date } {
  const today = zonedDateParts(now, TZ);

  // Step the calendar date in UTC (no DST) and read the result back as a plain
  // Y/M/D, so month and year rollovers come for free.
  const target = new Date(
    Date.UTC(today.year, today.month - 1, today.day) + daysFromNow * DAY
  );
  const y = target.getUTCFullYear();
  const m = target.getUTCMonth() + 1;
  const d = target.getUTCDate();

  const next = new Date(target.getTime() + DAY);

  return {
    start: zonedWallTimeToUtc(y, m, d, 0, 0, TZ),
    end: zonedWallTimeToUtc(
      next.getUTCFullYear(),
      next.getUTCMonth() + 1,
      next.getUTCDate(),
      0,
      0,
      TZ
    ),
  };
}
