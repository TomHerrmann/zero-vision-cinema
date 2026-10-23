/**
 * Every Zero Vision Cinema event is in New York, so event times are always
 * read, written and shown in Eastern time, whatever time zone the server or
 * the viewer is in. These helpers turn a stored instant into New York wall
 * time without depending on the machine's own zone or ICU spacing quirks.
 */

export const EVENT_TIME_ZONE = 'America/New_York';

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** New York wall-clock parts for an instant, plus its UTC offset in minutes. */
export function easternParts(datetime: string | Date) {
  const instant = new Date(datetime);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: EVENT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const map: Record<string, number> = {};
  for (const p of parts) if (p.type !== 'literal') map[p.type] = Number(p.value);
  const { year, month, day, hour, minute, second } = map;
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  const offsetMinutes = Math.round(
    (wallAsUtc - Math.floor(instant.getTime() / 1000) * 1000) / 60000
  );
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return { year, month, day, hour, minute, second, weekday, offsetMinutes };
}

/** 2026-10-03T23:30:00Z → "2026-10-03T19:30:00-04:00" (same instant). */
export function toEasternIso(datetime: string | Date): string {
  const { year, month, day, hour, minute, second, offsetMinutes } =
    easternParts(datetime);
  const sign = offsetMinutes < 0 ? '-' : '+';
  const abs = Math.abs(offsetMinutes);
  return (
    `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}` +
    `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  );
}

/** The New York calendar date, e.g. "2026-10-03". */
export function easternDate(datetime: string | Date): string {
  const { year, month, day } = easternParts(datetime);
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** "7:30 PM ET" */
export function easternTimeLabel(datetime: string | Date): string {
  const { hour, minute } = easternParts(datetime);
  const h12 = hour % 12 || 12;
  return `${h12}:${pad(minute)} ${hour < 12 ? 'AM' : 'PM'} ET`;
}

/** "Saturday, October 3, 2026, 7:30 PM ET" */
export function easternLabel(datetime: string | Date): string {
  const { year, month, day, weekday } = easternParts(datetime);
  return `${WEEKDAYS[weekday]}, ${MONTHS[month - 1]} ${day}, ${year}, ${easternTimeLabel(datetime)}`;
}
