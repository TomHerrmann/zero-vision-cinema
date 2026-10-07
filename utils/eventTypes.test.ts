import { describe, it, expect } from 'vitest';
import { nextDefaultDatetime } from './eventTypes';

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
