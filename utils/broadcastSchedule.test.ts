import { describe, it, expect } from 'vitest';
import { computeBroadcastSchedule } from './broadcastSchedule';

const DAY = 24 * 60 * 60 * 1000;

// 2026-08-19 19:00 ET (EDT, UTC−4) === 2026-08-19T23:00:00Z
const SUMMER_EVENING = new Date('2026-08-19T23:00:00.000Z');
// 2026-01-14 19:00 ET (EST, UTC−5) === 2026-01-15T00:00:00Z
const WINTER_EVENING = new Date('2026-01-15T00:00:00.000Z');
// 2026-08-19 08:00 ET === 2026-08-19T12:00:00Z
const SUMMER_MORNING = new Date('2026-08-19T12:00:00.000Z');

describe('computeBroadcastSchedule', () => {
  it('announcement = 6 days before at 9am ET; reminder = event day 9am ET (EDT)', () => {
    const { announcementAt, reminderAt } = computeBroadcastSchedule(
      new Date(SUMMER_EVENING.getTime() - 30 * DAY),
      SUMMER_EVENING
    );
    expect(announcementAt?.toISOString()).toBe('2026-08-13T13:00:00.000Z'); // 8/13 9am EDT
    expect(reminderAt?.toISOString()).toBe('2026-08-19T13:00:00.000Z'); // 8/19 9am EDT
  });

  it('is DST-correct in winter (EST, UTC−5)', () => {
    const { announcementAt, reminderAt } = computeBroadcastSchedule(
      new Date(WINTER_EVENING.getTime() - 30 * DAY),
      WINTER_EVENING
    );
    // Event ET date is 2026-01-14. −6d = 2026-01-08. 9am EST = 14:00Z.
    expect(announcementAt?.toISOString()).toBe('2026-01-08T14:00:00.000Z');
    expect(reminderAt?.toISOString()).toBe('2026-01-14T14:00:00.000Z');
  });

  it('drops the announcement when published fewer than 6 days out', () => {
    const { announcementAt, reminderAt } = computeBroadcastSchedule(
      new Date(SUMMER_EVENING.getTime() - 3 * DAY),
      SUMMER_EVENING
    );
    expect(announcementAt).toBeNull();
    expect(reminderAt?.toISOString()).toBe('2026-08-19T13:00:00.000Z');
  });

  it('drops both when the 9am slots are already past', () => {
    const { announcementAt, reminderAt } = computeBroadcastSchedule(
      new Date('2026-08-19T18:00:00.000Z'), // 2pm ET on event day
      SUMMER_EVENING
    );
    expect(announcementAt).toBeNull();
    expect(reminderAt).toBeNull();
  });

  it('reminder falls back to 2h before start for an early-morning event', () => {
    const { reminderAt } = computeBroadcastSchedule(
      new Date(SUMMER_MORNING.getTime() - 30 * DAY),
      SUMMER_MORNING
    );
    expect(reminderAt?.toISOString()).toBe('2026-08-19T10:00:00.000Z'); // start − 2h
  });
});
