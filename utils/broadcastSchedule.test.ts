import { describe, it, expect } from 'vitest';
import { etDayRangeUtc, ANNOUNCE_DAYS_BEFORE } from './broadcastSchedule';

const HOURS = (ms: number) => ms / (60 * 60 * 1000);

// 2026-08-19 19:00 ET (EDT, UTC−4)
const SUMMER = new Date('2026-08-19T23:00:00.000Z');
// 2026-01-14 19:00 ET (EST, UTC−5)
const WINTER = new Date('2026-01-15T00:00:00.000Z');

describe('etDayRangeUtc', () => {
  it('brackets today in EDT (midnight ET = 04:00Z)', () => {
    const { start, end } = etDayRangeUtc(SUMMER, 0);
    expect(start.toISOString()).toBe('2026-08-19T04:00:00.000Z');
    expect(end.toISOString()).toBe('2026-08-20T04:00:00.000Z');
  });

  it('brackets today in EST (midnight ET = 05:00Z)', () => {
    const { start, end } = etDayRangeUtc(WINTER, 0);
    expect(start.toISOString()).toBe('2026-01-14T05:00:00.000Z');
    expect(end.toISOString()).toBe('2026-01-15T05:00:00.000Z');
  });

  it('steps forward by the announcement offset', () => {
    const { start, end } = etDayRangeUtc(SUMMER, ANNOUNCE_DAYS_BEFORE);
    expect(start.toISOString()).toBe('2026-08-25T04:00:00.000Z');
    expect(end.toISOString()).toBe('2026-08-26T04:00:00.000Z');
  });

  it('rolls over month boundaries', () => {
    // 2026-08-26 ET + 6 days = 2026-09-01 ET
    const { start } = etDayRangeUtc(
      new Date('2026-08-26T23:00:00.000Z'),
      ANNOUNCE_DAYS_BEFORE
    );
    expect(start.toISOString()).toBe('2026-09-01T04:00:00.000Z');
  });

  it('does not depend on the time of day within the ET date', () => {
    // 00:30 ET and 23:30 ET on 2026-08-19 must yield the same window.
    const early = etDayRangeUtc(new Date('2026-08-19T04:30:00.000Z'), 0);
    const late = etDayRangeUtc(new Date('2026-08-20T03:30:00.000Z'), 0);
    expect(early.start.toISOString()).toBe(late.start.toISOString());
    expect(early.end.toISOString()).toBe(late.end.toISOString());
  });

  it('is 23 hours wide on the spring-forward day', () => {
    // US DST begins 2026-03-08; 2am ET jumps to 3am.
    const { start, end } = etDayRangeUtc(
      new Date('2026-03-08T17:00:00.000Z'),
      0
    );
    expect(start.toISOString()).toBe('2026-03-08T05:00:00.000Z'); // EST
    expect(end.toISOString()).toBe('2026-03-09T04:00:00.000Z'); // EDT
    expect(HOURS(end.getTime() - start.getTime())).toBe(23);
  });

  it('is 25 hours wide on the fall-back day', () => {
    // US DST ends 2026-11-01; 2am ET falls back to 1am.
    const { start, end } = etDayRangeUtc(
      new Date('2026-11-01T17:00:00.000Z'),
      0
    );
    expect(start.toISOString()).toBe('2026-11-01T04:00:00.000Z'); // EDT
    expect(end.toISOString()).toBe('2026-11-02T05:00:00.000Z'); // EST
    expect(HOURS(end.getTime() - start.getTime())).toBe(25);
  });

  it('produces contiguous, non-overlapping windows across the offsets', () => {
    // Whatever the DST situation, day N's end is day N+1's start — so no event
    // can fall between two days or be picked up by both.
    for (let i = 0; i < 8; i++) {
      const a = etDayRangeUtc(new Date('2026-03-05T17:00:00.000Z'), i);
      const b = etDayRangeUtc(new Date('2026-03-05T17:00:00.000Z'), i + 1);
      expect(a.end.toISOString()).toBe(b.start.toISOString());
    }
  });
});
