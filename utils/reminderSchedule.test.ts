import { describe, it, expect } from 'vitest';
import { computeReminderSchedule } from './reminderSchedule';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** ET wall-clock in local ET → the value's `toISOString()` for readable expectations. */
// Summer (EDT, UTC−4): 2026-08-15 19:00 ET === 2026-08-15T23:00:00Z
const SUMMER_EVENING = new Date('2026-08-15T23:00:00.000Z');
// Winter (EST, UTC−5): 2026-01-15 19:00 ET === 2026-01-16T00:00:00Z
const WINTER_EVENING = new Date('2026-01-16T00:00:00.000Z');
// Early morning (EDT): 2026-08-15 08:00 ET === 2026-08-15T12:00:00Z
const SUMMER_MORNING = new Date('2026-08-15T12:00:00.000Z');

const boughtDaysBefore = (event: Date, days: number) =>
  new Date(event.getTime() - days * DAY);

describe('computeReminderSchedule', () => {
  it('bought ≥7 days out: schedules pre-event (−7d) and day-of (9am ET)', () => {
    const { preEventAt, dayOfAt } = computeReminderSchedule(
      boughtDaysBefore(SUMMER_EVENING, 10),
      SUMMER_EVENING
    );
    expect(preEventAt?.toISOString()).toBe('2026-08-08T23:00:00.000Z'); // event − 7d
    expect(dayOfAt?.toISOString()).toBe('2026-08-15T13:00:00.000Z'); // 9am EDT
  });

  it('bought exactly 7 days out still schedules the pre-event email', () => {
    const { preEventAt } = computeReminderSchedule(
      boughtDaysBefore(SUMMER_EVENING, 7),
      SUMMER_EVENING
    );
    expect(preEventAt?.toISOString()).toBe('2026-08-08T23:00:00.000Z');
  });

  it('bought 48h–7d out: no pre-event email, but day-of still scheduled', () => {
    const { preEventAt, dayOfAt } = computeReminderSchedule(
      boughtDaysBefore(SUMMER_EVENING, 3),
      SUMMER_EVENING
    );
    expect(preEventAt).toBeNull();
    expect(dayOfAt?.toISOString()).toBe('2026-08-15T13:00:00.000Z');
  });

  it('bought <48h out: neither reminder is scheduled', () => {
    const { preEventAt, dayOfAt } = computeReminderSchedule(
      new Date(SUMMER_EVENING.getTime() - 24 * HOUR),
      SUMMER_EVENING
    );
    expect(preEventAt).toBeNull();
    expect(dayOfAt).toBeNull();
  });

  it('is DST-correct: winter event day-of is 9am EST (UTC−5)', () => {
    const { dayOfAt } = computeReminderSchedule(
      boughtDaysBefore(WINTER_EVENING, 10),
      WINTER_EVENING
    );
    // 9am EST on 2026-01-15 (the event's ET calendar date) === 14:00Z
    expect(dayOfAt?.toISOString()).toBe('2026-01-15T14:00:00.000Z');
  });

  it('early-morning event: 9am slot is past start, falls back to 2h before start', () => {
    const { dayOfAt } = computeReminderSchedule(
      boughtDaysBefore(SUMMER_MORNING, 10),
      SUMMER_MORNING
    );
    expect(dayOfAt?.toISOString()).toBe('2026-08-15T10:00:00.000Z'); // start − 2h
  });

  it('day-of reads the ET calendar date (not the UTC date) for late-UTC events', () => {
    // WINTER_EVENING is 2026-01-16 in UTC but 2026-01-15 in ET.
    const { dayOfAt } = computeReminderSchedule(
      boughtDaysBefore(WINTER_EVENING, 10),
      WINTER_EVENING
    );
    const etDate = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    }).format(dayOfAt!);
    expect(etDate).toContain('01/15/2026');
    expect(etDate).toContain('09'); // 9am ET
  });
});
