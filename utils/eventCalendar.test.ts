import { describe, it, expect } from 'vitest';
import {
  buildIcs,
  buildIcsFeed,
  calendarTitle,
  withYear,
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
    expect(url.searchParams.get('ctz')).toBe('America/New_York');
  });
});

describe('calendarTitle', () => {
  it('puts FREE before the series for $0 events', () => {
    expect(calendarTitle('The Thing (1982)', 'Astoria Horror Club', true)).toBe(
      'The Thing (1982) | FREE | Astoria Horror Club'
    );
  });
  it('leaves FREE out of paid events', () => {
    expect(calendarTitle('The Thing (1982)', 'Zero Vision Cinema', false)).toBe(
      'The Thing (1982) | Zero Vision Cinema'
    );
  });
});

describe('withYear', () => {
  it('adds the year when the name has none', () => {
    expect(withYear('The Thing', '1982')).toBe('The Thing (1982)');
  });
  it('keeps a name that already has a year', () => {
    expect(withYear('The Thing (1982)', '1982')).toBe('The Thing (1982)');
  });
  it('takes the first year of an OMDB range and skips a missing one', () => {
    expect(withYear('Twin Peaks', '1990–1991')).toBe('Twin Peaks (1990)');
    expect(withYear('Bingo', null)).toBe('Bingo');
  });
});

describe('buildIcsFeed', () => {
  const feed = buildIcsFeed(
    [event, { ...event, id: 11, title: 'Second' }],
    new Date('2026-10-01T12:00:00.000Z')
  );
  it('names the calendar and holds every event', () => {
    expect(feed).toContain('X-WR-CALNAME:Zero Vision Cinema Events');
    expect(feed).toContain('X-WR-TIMEZONE:America/New_York');
    expect(feed.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(feed).toContain('UID:event-11@zerovisioncinema.com');
    expect(feed.trim().endsWith('END:VCALENDAR')).toBe(true);
  });
});
