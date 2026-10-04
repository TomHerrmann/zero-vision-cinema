import { etDayRangeUtc } from './broadcastSchedule';

/**
 * When an event stops selling tickets and its page stops being reachable.
 *
 * Events only have a start `datetime` (no end time), so an event counts as
 * over at the end of its own calendar day in the venue timezone
 * (America/New_York). That leaves late buyers the whole evening of the
 * screening, while a page from yesterday never shows a live checkout.
 */
export function eventEndsAt(datetime: string | Date): Date {
  return etDayRangeUtc(new Date(datetime), 0).end;
}

export function hasEventEnded(
  event: { datetime: string },
  now: Date = new Date()
): boolean {
  return now.getTime() >= eventEndsAt(event.datetime).getTime();
}
