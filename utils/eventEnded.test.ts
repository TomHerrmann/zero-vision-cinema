import { describe, it, expect } from 'vitest';
import { eventEndsAt, hasEventEnded } from './eventEnded';

describe('hasEventEnded', () => {
  // 7:30pm ET on 2026-10-03 (EDT, UTC-4).
  const event = { datetime: '2026-10-03T23:30:00.000Z' };

  it('ends at midnight ET after the screening day', () => {
    expect(eventEndsAt(event.datetime).toISOString()).toBe(
      '2026-10-04T04:00:00.000Z'
    );
  });

  it('is still on before start and during the evening', () => {
    expect(hasEventEnded(event, new Date('2026-10-03T12:00:00.000Z'))).toBe(
      false
    );
    // 11:59pm ET, after showtime but same ET day.
    expect(hasEventEnded(event, new Date('2026-10-04T03:59:00.000Z'))).toBe(
      false
    );
  });

  it('is over from midnight ET onward', () => {
    expect(hasEventEnded(event, new Date('2026-10-04T04:00:00.000Z'))).toBe(
      true
    );
    expect(hasEventEnded(event, new Date('2026-11-01T00:00:00.000Z'))).toBe(
      true
    );
  });

  it('uses the ET day, not the UTC day, for a late show', () => {
    // 11pm ET on 2026-12-05 is already 2026-12-06 in UTC (EST, UTC-5).
    const late = { datetime: '2026-12-06T04:00:00.000Z' };
    expect(eventEndsAt(late.datetime).toISOString()).toBe(
      '2026-12-06T05:00:00.000Z'
    );
  });
});
