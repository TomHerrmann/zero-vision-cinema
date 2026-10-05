import { describe, it, expect } from 'vitest';
import { upcomingEmails, daysUntil, timeAgo } from './dashboardData';

// 2026-10-05 10:00 ET
const NOW = new Date('2026-10-05T14:00:00Z');

const event = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'The Shining',
  // Thu Oct 8, 7:30 PM ET
  datetime: '2026-10-08T23:30:00Z',
  _status: 'published' as const,
  announcementSentAt: null,
  reminderSentAt: null,
  ...overrides,
});

describe('upcomingEmails', () => {
  it('lists the reminder on the event day', () => {
    const emails = upcomingEmails([event({ announcementSentAt: '2026-10-02T13:00:00Z' })], NOW);
    expect(emails).toHaveLength(1);
    expect(emails[0].kind).toBe('reminder');
    expect(emails[0].sendsOn.toISOString().slice(0, 10)).toBe('2026-10-08');
  });

  it('lists an announcement six days before, soonest first', () => {
    const emails = upcomingEmails(
      [event({ id: 2, name: 'House', datetime: '2026-10-15T00:00:00Z' })],
      NOW
    );
    // Oct 14, 8 PM ET → announcement Oct 8, reminder Oct 14
    expect(emails.map((e) => [e.kind, e.sendsOn.toISOString().slice(0, 10)])).toEqual([
      ['announcement', '2026-10-08'],
      ['reminder', '2026-10-14'],
    ]);
  });

  it('drops an announcement whose day already passed unsent', () => {
    const emails = upcomingEmails([event()], NOW);
    expect(emails.map((e) => e.kind)).toEqual(['reminder']);
  });

  it('skips drafts and anything already sent', () => {
    expect(upcomingEmails([event({ _status: 'draft' })], NOW)).toEqual([]);
    expect(
      upcomingEmails(
        [event({ reminderSentAt: '2026-10-08T13:00:00Z', announcementSentAt: 'x' })],
        NOW
      )
    ).toEqual([]);
  });

  it('uses the New York day for late-night events', () => {
    // 11:30 PM ET on Oct 5 is already Oct 6 in UTC
    const emails = upcomingEmails(
      [event({ datetime: '2026-10-06T03:30:00Z', announcementSentAt: 'x' })],
      NOW
    );
    expect(emails[0].sendsOn.toISOString().slice(0, 10)).toBe('2026-10-05');
  });
});

describe('daysUntil / timeAgo', () => {
  it('counts New York days', () => {
    expect(daysUntil('2026-10-08T23:30:00Z', NOW)).toBe(3);
    expect(daysUntil('2026-10-06T03:30:00Z', NOW)).toBe(0);
  });

  it('reads like a person', () => {
    expect(timeAgo('2026-10-05T13:48:00Z', NOW)).toBe('12 min ago');
    expect(timeAgo('2026-10-05T11:00:00Z', NOW)).toBe('3 hr ago');
    expect(timeAgo('2026-10-04T12:00:00Z', NOW)).toBe('Yesterday');
  });
});
