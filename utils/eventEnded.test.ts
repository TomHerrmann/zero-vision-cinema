import { describe, it, expect } from 'vitest';
import { eventClosesAt, isEventClosed } from './eventEnded';

// 7:30pm ET on 2026-10-03.
const event = { datetime: '2026-10-03T23:30:00.000Z' };
const at = (iso: string) => new Date(iso);

describe('isEventClosed', () => {
  it('closes an hour after the start', () => {
    expect(eventClosesAt(event.datetime).toISOString()).toBe(
      '2026-10-04T00:30:00.000Z'
    );
  });

  it('is open before and during the first hour', () => {
    expect(isEventClosed(event, at('2026-10-03T12:00:00.000Z'))).toBe(false);
    expect(isEventClosed(event, at('2026-10-04T00:29:59.000Z'))).toBe(false);
  });

  it('is closed from an hour after the start onward', () => {
    expect(isEventClosed(event, at('2026-10-04T00:30:00.000Z'))).toBe(true);
    expect(isEventClosed(event, at('2026-11-01T00:00:00.000Z'))).toBe(true);
  });
});
