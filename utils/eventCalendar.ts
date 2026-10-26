/**
 * "Add to calendar" for events: the event's calendar end time, plus the .ics
 * file and Google Calendar link built from it.
 *
 * Events only store a start `datetime`, so the end is estimated: start + 15
 * minutes of pre-show + the film's runtime, or a flat 75 minutes when the
 * runtime is unknown (including book club events, which have no film).
 */

/** Every event is in NYC, so calendar entries are pinned to New York time. */
export const EVENT_TIME_ZONE = 'America/New_York';

const MINUTE = 60 * 1000;

export const PRE_SHOW_MINUTES = 15;
export const DEFAULT_RUNTIME_MINUTES = 75;
/** Every Halloweek event goes on the calendar as two hours long. */
export const HALLOWEEK_DURATION_MINUTES = 120;

/** OMDB runtimes look like "118 min"; anything else counts as unknown. */
export function parseRuntimeMinutes(runtime?: string | null): number | null {
  const match = runtime?.match(/(\d+)\s*min/i);
  const minutes = match ? Number(match[1]) : NaN;
  return minutes > 0 ? minutes : null;
}

export function eventCalendarEnd(
  datetime: string | Date,
  runtimeMinutes?: number | null
): Date {
  const runtime = runtimeMinutes ?? DEFAULT_RUNTIME_MINUTES;
  return new Date(
    new Date(datetime).getTime() + (PRE_SHOW_MINUTES + runtime) * MINUTE
  );
}

export type CalendarEvent = {
  /** Stable per event; becomes the calendar UID, so re-adding updates it. */
  id: number | string;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
  url?: string;
};

/** 2026-10-03T23:30:00.000Z → 20261003T233000Z */
const utcStamp = (date: Date) =>
  date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** RFC 5545 TEXT escaping. */
const escapeText = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

/** RFC 5545 line folding: at most 75 octets per line, continuations indented. */
function foldLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const decoder = new TextDecoder();
  const parts: string[] = [];
  let start = 0;
  let limit = 75;
  while (start < bytes.length) {
    let end = Math.min(start + limit, bytes.length);
    // Don't split a multi-byte character.
    while (end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
    parts.push(decoder.decode(bytes.slice(start, end)));
    start = end;
    limit = 74; // the leading space counts toward the 75
  }
  return parts.join('\r\n ');
}

/** The VEVENT lines for one event (no calendar wrapper). */
function veventLines(event: CalendarEvent, now: Date): string[] {
  return [
    'BEGIN:VEVENT',
    `UID:event-${event.id}@zerovisioncinema.com`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${utcStamp(event.start)}`,
    `DTEND:${utcStamp(event.end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    event.location && `LOCATION:${escapeText(event.location)}`,
    event.description && `DESCRIPTION:${escapeText(event.description)}`,
    event.url && `URL:${event.url}`,
    'END:VEVENT',
  ].filter(Boolean) as string[];
}

const CALENDAR_HEADER = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//Zero Vision Cinema//Events//EN',
  'CALSCALE:GREGORIAN',
  'METHOD:PUBLISH',
];

const serialize = (lines: string[]) =>
  lines.map(foldLine).join('\r\n') + '\r\n';

export function buildIcs(event: CalendarEvent, now: Date = new Date()): string {
  return serialize([...CALENDAR_HEADER, ...veventLines(event, now), 'END:VCALENDAR']);
}

/** Name subscribers see for the all-events calendar. */
export const CALENDAR_NAME = 'Zero Vision Cinema Events';

/**
 * The subscribable calendar: every event in one feed. The refresh hints ask
 * apps to re-check every few hours (Google ignores them and polls on its own
 * schedule, usually within a day).
 */
export function buildIcsFeed(
  events: CalendarEvent[],
  now: Date = new Date()
): string {
  return serialize([
    ...CALENDAR_HEADER,
    `X-WR-CALNAME:${escapeText(CALENDAR_NAME)}`,
    `NAME:${escapeText(CALENDAR_NAME)}`,
    `X-WR-CALDESC:${escapeText('Screenings, book club and horror nights around Astoria, from Zero Vision Cinema.')}`,
    `X-WR-TIMEZONE:${EVENT_TIME_ZONE}`,
    'REFRESH-INTERVAL;VALUE=DURATION:PT6H',
    'X-PUBLISHED-TTL:PT6H',
    ...events.flatMap((event) => veventLines(event, now)),
    'END:VCALENDAR',
  ]);
}

/**
 * Calendar entry title: "Title (Year) | Series", with FREE before the series
 * when the event costs nothing — "The Thing (1982) | FREE | Astoria Horror
 * Club". Title first so it survives a narrow month view.
 */
export function calendarTitle(
  title: string,
  seriesName: string,
  free: boolean
): string {
  return [title, free && 'FREE', seriesName].filter(Boolean).join(' | ');
}

/** "The Thing" + "1982" → "The Thing (1982)", unless the name already has a year. */
export function withYear(name: string, year?: string | null): string {
  if (/\(\d{4}\)/.test(name)) return name;
  const y = year?.match(/\d{4}/)?.[0];
  return y ? `${name} (${y})` : name;
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${utcStamp(event.start)}/${utcStamp(event.end)}`,
    // Events are in NYC: show the entry in New York time, not the viewer's.
    ctz: EVENT_TIME_ZONE,
  });
  if (event.location) params.set('location', event.location);
  if (event.description) params.set('details', event.description);
  return `https://calendar.google.com/calendar/render?${params}`;
}
