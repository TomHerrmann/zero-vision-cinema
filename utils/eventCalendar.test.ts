import { describe, it, expect } from 'vitest';
import {
  buildIcs,
  eventCalendarEnd,
  googleCalendarUrl,
  parseRuntimeMinutes,
} from './eventCalendar';

// 7:30pm ET on 2026-10-03.
const START = '2026-10-03T23:30:00.000Z';

describe('eventCalendarEnd', () => {
  it('is start + 15 minutes + the runtime', () => {
    // 7:30pm + 15 + 118 = 9:43pm ET.
    expect(eventCalendarEnd(START, 118).toISOString()).toBe(
      '2026-10-04T01:43:00.000Z'
    );
  });

  it('assumes a 75 minute film when the runtime is unknown', () => {
    expect(eventCalendarEnd(START, null).toISOString()).toBe(
      '2026-10-04T01:00:00.000Z'
    );
  });
});

describe('parseRuntimeMinutes', () => {
  it('reads OMDB runtimes and rejects anything else', () => {
    expect(parseRuntimeMinutes('118 min')).toBe(118);
    expect(parseRuntimeMinutes('N/A')).toBeNull();
    expect(parseRuntimeMinutes('')).toBeNull();
    expect(parseRuntimeMinutes(undefined)).toBeNull();
  });
});

const event = {
  id: 10,
  title: 'The Evil Dead (1981)',
  start: new Date(START),
  end: new Date('2026-10-04T01:00:00.000Z'),
  location: 'The Bar, 12-34 Broadway; Astoria',
  description: 'Details: https://zerovisioncinema.com/events/10',
  url: 'https://zerovisioncinema.com/events/10',
};

describe('buildIcs', () => {
  const ics = buildIcs(event, new Date('2026-10-01T12:00:00.000Z'));

  it('writes a single UTC-timed event', () => {
    expect(ics).toContain('UID:event-10@zerovisioncinema.com\r\n');
    expect(ics).toContain('DTSTART:20261003T233000Z\r\n');
    expect(ics).toContain('DTEND:20261004T010000Z\r\n');
    expect(ics).toContain('DTSTAMP:20261001T120000Z\r\n');
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('escapes text values', () => {
    expect(ics).toContain('LOCATION:The Bar\\, 12-34 Broadway\; Astoria\r\n');
  });

  it('folds lines longer than 75 octets', () => {
    const long = buildIcs({ ...event, title: 'x'.repeat(200) });
    for (const line of long.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(long.replace(/\r\n /g, '')).toContain(`SUMMARY:${'x'.repeat(200)}`);
  });
});

describe('googleCalendarUrl', () => {
  it('prefills title, times and place', () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.origin).toBe('https://calendar.google.com');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe('The Evil Dead (1981)');
    expect(url.searchParams.get('dates')).toBe(
      '20261003T233000Z/20261004T010000Z'
    );
    expect(url.searchParams.get('location')).toBe(event.location);
  });
});
