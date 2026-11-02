import type { Event, Location } from '@/payload-types';
import { AHC_SITE_URL, ZVC_SITE_URL } from '@/app/contsants/constants';
import {
  HALLOWEEK_VENUES,
  type HalloweekSlot,
} from '@/app/(frontend)/halloweek2026/halloweek.data';
import { fetchMovieDataByImdbId } from '@/lib/omdb';
import {
  calendarTitle,
  eventCalendarEnd,
  HALLOWEEK_DURATION_MINUTES,
  parseRuntimeMinutes,
  withYear,
  type CalendarEvent,
} from '@/utils/eventCalendar';
import { EVENT_TYPE_NAMES, eventTitle, isPaidEventType } from '@/utils/eventTypes';
import { richTextToPlain } from '@/utils/richText';

const HALLOWEEK_PAGE_URL = `${ZVC_SITE_URL}/halloweek2026`;

/**
 * A Payload event as a calendar entry, for both the single-event "Add to
 * calendar" file and the subscribable all-events feed, so the two always
 * match. Title is "Title (Year) | FREE | Series" (FREE only at $0); the year
 * comes from OMDB when the name doesn't already carry one.
 */
export async function payloadCalendarEvent(event: Event): Promise<CalendarEvent> {
  const movie = event.imdbId
    ? await fetchMovieDataByImdbId(event.imdbId).catch(() => null)
    : null;
  const location =
    typeof event.location === 'object' ? (event.location as Location) : null;
  const paid = isPaidEventType(event.eventType);
  const url = paid ? `${ZVC_SITE_URL}/events/${event.id}` : AHC_SITE_URL;
  const free = !(Number(event.price) > 0);

  const title = eventTitle({ ...event, name: withYear(event.name, movie?.year) });
  const description = [
    richTextToPlain(event.description),
    `Details: ${url}`,
    !free && event.paymentLink && `Tickets: ${event.paymentLink}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    id: event.id,
    title: calendarTitle(title, EVENT_TYPE_NAMES[event.eventType], free),
    start: new Date(event.datetime),
    end: eventCalendarEnd(event.datetime, parseRuntimeMinutes(movie?.runtime)),
    location: location
      ? [location.name, location.address].filter(Boolean).join(', ')
      : undefined,
    description,
    url,
  };
}

/** A Halloweek lineup slot (static data, every one free) as a calendar entry. */
export function halloweekCalendarEvent(slot: HalloweekSlot): CalendarEvent {
  const venue = HALLOWEEK_VENUES.find((v) => v.name === slot.venueName);
  const start = new Date(slot.datetime);
  return {
    id: `halloweek2026-${slot.id}`,
    title: calendarTitle(slot.title, 'Halloweek', true),
    start,
    end: new Date(start.getTime() + HALLOWEEK_DURATION_MINUTES * 60 * 1000),
    location: venue ? `${venue.name}, ${venue.address}` : slot.venueName,
    description: `${slot.description}\n\nDetails: ${HALLOWEEK_PAGE_URL}`,
    url: HALLOWEEK_PAGE_URL,
  };
}
