import { describe, expect, it } from 'vitest';
import {
  easternDate,
  easternLabel,
  easternTimeLabel,
  toEasternIso,
} from './easternTime';

describe('easternTime', () => {
  it('uses EDT in summer and EST in winter', () => {
    expect(toEasternIso('2026-10-03T23:30:00.000Z')).toBe('2026-10-03T19:30:00-04:00');
    expect(toEasternIso('2026-01-15T00:30:00.000Z')).toBe('2026-01-14T19:30:00-05:00');
  });

  it('keeps the same instant', () => {
    const iso = '2026-11-01T06:30:00.000Z'; // 1:30am EST, just after fall back
    expect(new Date(toEasternIso(iso)).toISOString()).toBe(iso);
  });

  it('reads the date in New York, not UTC', () => {
    expect(easternDate('2026-10-04T02:00:00.000Z')).toBe('2026-10-03');
  });

  it('labels noon and midnight correctly', () => {
    expect(easternTimeLabel('2026-10-03T16:00:00.000Z')).toBe('12:00 PM ET');
    expect(easternTimeLabel('2026-10-04T04:05:00.000Z')).toBe('12:05 AM ET');
    expect(easternLabel('2026-10-31T23:00:00.000Z')).toBe(
      'Saturday, October 31, 2026, 7:00 PM ET'
    );
  });
});
