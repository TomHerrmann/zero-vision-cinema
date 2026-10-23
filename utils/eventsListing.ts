import type { Event } from '@/payload-types';
import type { HalloweekSlot } from '@/app/(frontend)/halloweek2026/halloweek.data';

/** How long after its start an event stays on the /events page. */
export const LISTED_AFTER_START_MINUTES = 30;

export type ListedEvent =
  | { kind: 'event'; datetime: string; event: Event }
  | { kind: 'halloweek'; datetime: string; slot: HalloweekSlot };

const startMinute = (datetime: string) =>
  Math.floor(new Date(datetime).getTime() / 60_000);

/**
 * Everything on the /events page, soonest first: published Payload events of
 * every type plus the upcoming Halloweek lineup.
 *
 * A Halloweek slot that starts the same minute as a Payload event is the same
 * night entered twice, so only the Payload event is kept — it carries the
 * ticket link, sold-out state and calendar feed.
 */
export function buildEventListing(
  events: Event[],
  halloweekSlots: HalloweekSlot[],
  now: Date = new Date()
): ListedEvent[] {
  const cutoff = now.getTime() - LISTED_AFTER_START_MINUTES * 60 * 1000;
  const isUpcoming = (datetime: string) =>
    new Date(datetime).getTime() > cutoff;

  const eventStarts = new Set(events.map((e) => startMinute(e.datetime)));

  const listed: ListedEvent[] = [
    ...events
      .filter((event) => isUpcoming(event.datetime))
      .map((event) => ({
        kind: 'event' as const,
        datetime: event.datetime,
        event,
      })),
    ...halloweekSlots
      .filter(
        (slot) =>
          isUpcoming(slot.datetime) &&
          !eventStarts.has(startMinute(slot.datetime))
      )
      .map((slot) => ({
        kind: 'halloweek' as const,
        datetime: slot.datetime,
        slot,
      })),
  ];

  return listed.sort(
    (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
  );
}
