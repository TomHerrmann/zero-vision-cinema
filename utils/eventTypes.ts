import type { Event } from '@/payload-types';

export type EventType = Event['eventType'];

/**
 * Recurring neighborhood nights (Rewind Wednesdays, Fridays at Medusa,
 * Brewscares, Bingo). Free and unticketed like AHC, but each keeps its own
 * description and poster, and none is driven by a book.
 */
export const COMMUNITY_EVENT_TYPES = ['rww', 'fri', 'brew', 'bingo'] as const;

export type CommunityEventType = (typeof COMMUNITY_EVENT_TYPES)[number];

export const isCommunityEventType = (
  eventType?: string | null
): eventType is CommunityEventType =>
  (COMMUNITY_EVENT_TYPES as readonly string[]).includes(eventType ?? '');

/** Full name of each event type, as subscribers and the admin see it. */
export const EVENT_TYPE_NAMES: Record<EventType, string> = {
  zvc: 'Zero Vision Cinema',
  ahc: 'Astoria Horror Club',
  bookclub: 'Astoria Horror Book Club',
  rww: 'Rewind Wednesdays',
  fri: 'Fridays at Medusa',
  brew: 'Brewscares',
  bingo: 'Bingo',
};
