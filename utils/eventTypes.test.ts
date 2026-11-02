import { describe, it, expect } from 'vitest';
import { defaultFilmFormat, eventTitle, nextDefaultDatetime } from './eventTypes';

describe('nextDefaultDatetime', () => {
  // Wednesday Oct 7 2026, 5:39pm ET (EDT, UTC-4).
  const wed = new Date('2026-10-07T21:39:00Z');

  it('lands on the following weekday at the type time, in New York time', () => {
    expect(nextDefaultDatetime('ahc', wed)).toBe('2026-10-12T23:00:00.000Z'); // Mon 7pm
    expect(nextDefaultDatetime('bookclub', wed)).toBe('2026-10-14T23:00:00.000Z'); // Wed 7pm (next week)
    expect(nextDefaultDatetime('fri', wed)).toBe('2026-10-10T00:00:00.000Z'); // Fri 8pm
    expect(nextDefaultDatetime('brunch', wed)).toBe('2026-10-10T16:00:00.000Z'); // Sat noon
  });

  it('skips to next week when today is already that weekday', () => {
    expect(nextDefaultDatetime('zvc', wed)).toBe('2026-10-14T23:30:00.000Z'); // Wed 7:30pm
  });

  it('follows the clock change', () => {
    // Wed Oct 28 → Wed Nov 4, after DST ends (EST, UTC-5).
    expect(nextDefaultDatetime('rww', new Date('2026-10-28T15:00:00Z'))).toBe(
      '2026-11-05T00:30:00.000Z'
    );
  });
});

describe('eventTitle', () => {
  const scanners = { name: 'Scanners (1981)', eventType: 'zvc' as const };

  it('adds the format for VHS and 16mm', () => {
    expect(eventTitle({ ...scanners, filmFormat: 'vhs' })).toBe('Scanners (1981) on VHS');
    expect(eventTitle({ ...scanners, filmFormat: '16mm' })).toBe('Scanners (1981) on 16mm');
  });

  it('leaves digital, unset and Book Club names alone', () => {
    expect(eventTitle({ ...scanners, filmFormat: 'digital' })).toBe('Scanners (1981)');
    expect(eventTitle(scanners)).toBe('Scanners (1981)');
    expect(
      eventTitle({ name: 'Carrie — Stephen King', eventType: 'bookclub', filmFormat: 'vhs' })
    ).toBe('Carrie — Stephen King');
  });

  it('does not repeat a format already in the name', () => {
    expect(eventTitle({ name: 'Scanners (1981) on VHS', eventType: 'rww', filmFormat: 'vhs' })).toBe(
      'Scanners (1981) on VHS'
    );
  });
});

describe('defaultFilmFormat', () => {
  it('is VHS for Rewind Wednesdays and digital otherwise', () => {
    expect(defaultFilmFormat('rww')).toBe('vhs');
    expect(defaultFilmFormat('zvc')).toBe('digital');
    expect(defaultFilmFormat('ahc')).toBe('digital');
  });
});
