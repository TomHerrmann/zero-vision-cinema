import type { Event } from '@/payload-types';
import { zonedDateParts, zonedWallTimeToUtc } from './broadcastSchedule';

export type EventType = Event['eventType'];

/**
 * Recurring neighborhood nights (Rewind Wednesdays, Fridays at Medusa,
 * Brewscares, Bingo, Horror Brunch). Each keeps its own description and poster, and none is
 * driven by a book. All are free except Brewscares (see PAID_EVENT_TYPES).
 */
export const COMMUNITY_EVENT_TYPES = [
  'rww',
  'fri',
  'brew',
  'bingo',
  'brunch',
] as const;

export type CommunityEventType = (typeof COMMUNITY_EVENT_TYPES)[number];

export const isCommunityEventType = (
  eventType?: string | null
): eventType is CommunityEventType =>
  (COMMUNITY_EVENT_TYPES as readonly string[]).includes(eventType ?? '');

/**
 * Types that sell tickets through Stripe (price, ticket count, the on-site
 * ticket page). Every other type is forced to $0 on save.
 */
export const PAID_EVENT_TYPES = ['zvc', 'brew'] as const;

export const isPaidEventType = (eventType?: string | null): boolean =>
  (PAID_EVENT_TYPES as readonly string[]).includes(eventType ?? '');

/** Full name of each event type, as subscribers and the admin see it. */
export const EVENT_TYPE_NAMES: Record<EventType, string> = {
  zvc: 'Zero Vision Cinema',
  ahc: 'Astoria Horror Club',
  bookclub: 'Astoria Horror Book Club',
  rww: 'Rewind Wednesdays',
  fri: 'Fridays at Medusa',
  brew: 'Brewscares',
  bingo: 'Bingo',
  brunch: 'Horror Brunch',
};

/** When each type usually happens, in New York time. weekday: 0 = Sunday. */
export const DEFAULT_SCHEDULE: Record<
  EventType,
  { weekday: number; hour: number; minute: number }
> = {
  zvc: { weekday: 3, hour: 19, minute: 30 },
  ahc: { weekday: 1, hour: 19, minute: 0 },
  bookclub: { weekday: 3, hour: 19, minute: 0 },
  rww: { weekday: 3, hour: 19, minute: 30 },
  fri: { weekday: 5, hour: 20, minute: 0 },
  brew: { weekday: 3, hour: 19, minute: 30 },
  bingo: { weekday: 3, hour: 19, minute: 30 },
  brunch: { weekday: 6, hour: 12, minute: 0 },
};

/**
 * The type's next usual slot strictly after today (New York time): a Monday
 * type picked on a Monday lands on next week's Monday.
 */
export const nextDefaultDatetime = (
  eventType: EventType,
  now: Date = new Date()
): string => {
  const { weekday, hour, minute } = DEFAULT_SCHEDULE[eventType];
  const tz = 'America/New_York';
  const { year, month, day } = zonedDateParts(now, tz);
  const today = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const ahead = (weekday - today + 7) % 7 || 7;
  return zonedWallTimeToUtc(year, month, day + ahead, hour, minute, tz).toISOString();
};

/**
 * Settings field holding each type's default venue, e.g. `defaultVenueRww`.
 * The admin event form pre-fills the venue from it when the type is picked.
 */
export const defaultVenueField = (eventType: EventType) =>
  `defaultVenue${eventType[0].toUpperCase()}${eventType.slice(1)}` as const;
