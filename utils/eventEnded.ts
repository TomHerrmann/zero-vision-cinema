/**
 * When an event stops selling tickets and its page stops being reachable.
 *
 * Events only store a start `datetime`; an hour after it, the event page
 * redirects to /events, on-site checkout refuses it and its Stripe payment
 * link gets switched off.
 */

export const CLOSES_AFTER_MINUTES = 60;

export function eventClosesAt(datetime: string | Date): Date {
  return new Date(
    new Date(datetime).getTime() + CLOSES_AFTER_MINUTES * 60 * 1000
  );
}

export function isEventClosed(
  event: { datetime: string },
  now: Date = new Date()
): boolean {
  return now.getTime() >= eventClosesAt(event.datetime).getTime();
}
