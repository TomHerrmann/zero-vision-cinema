import { ANNOUNCE_DAYS_BEFORE } from '@/utils/broadcastSchedule';

const TZ = 'America/New_York';
const DAY = 24 * 60 * 60 * 1000;

type BroadcastEvent = {
  id: number | string;
  name: string;
  datetime: string;
  _status?: 'draft' | 'published' | null;
  announcementSentAt?: string | null;
  reminderSentAt?: string | null;
};

export type ScheduledEmail = {
  eventId: number | string;
  eventName: string;
  kind: 'announcement' | 'reminder';
  /** Noon UTC on the ET calendar day the email goes out (date-only value). */
  sendsOn: Date;
};

/** The ET calendar day of `date`, as noon UTC so it formats the same anywhere. */
const etDay = (date: Date): Date => {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .split('-')
    .map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
};

/**
 * The list emails still to go out for these events, soonest first. Mirrors
 * the morning send-due-broadcasts run: published events only, a reminder on
 * the event's ET day and an announcement ANNOUNCE_DAYS_BEFORE days earlier,
 * each skipped once its *SentAt stamp is set. An announcement whose day has
 * already passed unsent never goes out, so it is left off too.
 */
export function upcomingEmails(
  events: BroadcastEvent[],
  now: Date = new Date()
): ScheduledEmail[] {
  const today = etDay(now).getTime();
  const emails: ScheduledEmail[] = [];

  for (const event of events) {
    if (event._status !== 'published') continue;
    const eventDay = etDay(new Date(event.datetime));

    if (!event.reminderSentAt && eventDay.getTime() >= today) {
      emails.push({
        eventId: event.id,
        eventName: event.name,
        kind: 'reminder',
        sendsOn: eventDay,
      });
    }

    const announceDay = new Date(eventDay.getTime() - ANNOUNCE_DAYS_BEFORE * DAY);
    if (!event.announcementSentAt && announceDay.getTime() >= today) {
      emails.push({
        eventId: event.id,
        eventName: event.name,
        kind: 'announcement',
        sendsOn: announceDay,
      });
    }
  }

  return emails.sort((a, b) => a.sendsOn.getTime() - b.sendsOn.getTime());
}

/** "Thu, Oct 8" in New York time. */
export const formatDay = (date: Date | string): string =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));

/** "7:30 PM" in New York time. */
export const formatTime = (date: Date | string): string =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));

/** "Oct" and "8" for the date block on an event row. */
export const dateBlock = (date: Date | string) => {
  const d = new Date(date);
  return {
    month: new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: 'short' }).format(d),
    day: new Intl.DateTimeFormat('en-US', { timeZone: TZ, day: 'numeric' }).format(d),
  };
};

/** Whole ET days from today until `date`'s ET day (0 = today). */
export const daysUntil = (date: Date | string, now: Date = new Date()): number =>
  Math.round((etDay(new Date(date)).getTime() - etDay(now).getTime()) / DAY);

/** "12 min ago", "3 hr ago", "Yesterday", else a date. */
export function timeAgo(date: Date | string, now: Date = new Date()): string {
  const ms = now.getTime() - new Date(date).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  if (daysUntil(date, now) === -1) return 'Yesterday';
  return formatDay(date);
}
