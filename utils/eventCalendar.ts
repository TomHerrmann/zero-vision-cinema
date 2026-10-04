/**
 * "Add to calendar" for events: the event's calendar end time, plus the .ics
 * file and Google Calendar link built from it.
 *
 * Events only store a start `datetime`, so the end is estimated: start + 15
 * minutes of pre-show + the film's runtime, or a flat 75 minutes when the
 * runtime is unknown (including book club events, which have no film).
 */

const MINUTE = 60 * 1000;

export const PRE_SHOW_MINUTES = 15;
export const DEFAULT_RUNTIME_MINUTES = 75;

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
  id: number;
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

export function buildIcs(event: CalendarEvent, now: Date = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Zero Vision Cinema//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
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
    'END:VCALENDAR',
  ].filter(Boolean) as string[];
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${utcStamp(event.start)}/${utcStamp(event.end)}`,
  });
  if (event.location) params.set('location', event.location);
  if (event.description) params.set('details', event.description);
  return `https://calendar.google.com/calendar/render?${params}`;
}
