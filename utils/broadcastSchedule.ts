/**
 * When to send the two per-event announcement broadcasts, in the venue timezone
 * (America/New_York):
 *
 *  - announcement: 6 days before the event, 9:00 AM ET (e.g. a Wed 7pm event →
 *    the prior Thursday 9am ET).
 *  - reminder: the morning of the event, 9:00 AM ET.
 *
 * Both return null when the slot is already past relative to `from` (event
 * published too late, or the event is over). For an event that starts before
 * ~11am ET the reminder's 9am slot would land at/after start, so it falls back
 * to 2h before start. DST-correct via Intl — no dependency needed.
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const TZ = 'America/New_York';
const HOUR_OF_DAY = 9; // 9am local
const ANNOUNCE_DAYS_BEFORE = 6;

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

export function computeBroadcastSchedule(
  from: Date,
  eventStart: Date
): { announcementAt: Date | null; reminderAt: Date | null } {
  const { year, month, day } = zonedDateParts(eventStart, TZ);

  // Reminder: 9am ET on the event's date (fallback: 2h before an early start).
  let reminderAt: Date | null = zonedWallTimeToUtc(
    year,
    month,
    day,
    HOUR_OF_DAY,
    0,
    TZ
  );
  if (reminderAt.getTime() >= eventStart.getTime()) {
    reminderAt = new Date(eventStart.getTime() - 2 * HOUR);
  }
  if (reminderAt.getTime() <= from.getTime()) reminderAt = null;

  // Announcement: 9am ET on the event's date − 6 calendar days.
  const annAnchor = new Date(Date.UTC(year, month - 1, day) - ANNOUNCE_DAYS_BEFORE * DAY);
  let announcementAt: Date | null = zonedWallTimeToUtc(
    annAnchor.getUTCFullYear(),
    annAnchor.getUTCMonth() + 1,
    annAnchor.getUTCDate(),
    HOUR_OF_DAY,
    0,
    TZ
  );
  if (announcementAt.getTime() <= from.getTime()) announcementAt = null;

  return { announcementAt, reminderAt };
}
