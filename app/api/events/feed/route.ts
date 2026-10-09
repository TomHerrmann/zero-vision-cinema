import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import type { Location, Media } from '@/payload-types';
import { AHC_SITE_URL, ZVC_SITE_URL } from '@/app/contsants/constants';
import { getEventRuntimeMinutes } from '@/lib/eventRuntime';
import { fetchMovieDataByImdbId } from '@/lib/omdb';
import {
  fetchBookDataByOpenLibraryId,
  searchBookByTitleAuthor,
} from '@/lib/openlibrary';
import { eventCalendarEnd } from '@/utils/eventCalendar';
import { EVENT_TYPE_NAMES, isPaidEventType } from '@/utils/eventTypes';
import { richTextIsEmpty, richTextToPlain } from '@/utils/richText';

/**
 * Every upcoming published event, of every type, as plain JSON — the source
 * the daily event-rollout routine reads (see .claude/skills/event-rollout).
 *
 * Only what the public site already shows: no attendee or customer data.
 * Descriptions are flattened to plain text so the listing copy elsewhere is
 * exactly what Tom and Mary wrote in Payload (or the OMDB / Open Library
 * summary the site falls back to when they left it blank).
 */
export const dynamic = 'force-dynamic';

const absoluteUrl = (url?: string | null) =>
  !url ? null : url.startsWith('/') ? `${ZVC_SITE_URL}${url}` : url;

export async function GET() {
  const payload = await getPayload({ config: payloadConfig });
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      _status: { equals: 'published' },
      // Started up to a day ago, so an event added on the day still shows.
      datetime: {
        greater_than: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    },
    sort: ['datetime'],
    depth: 1,
    limit: 200,
  });

  const events = await Promise.all(
    docs.map(async (event) => {
      const location =
        typeof event.location === 'object' ? (event.location as Location) : null;
      const image =
        event.image && typeof event.image === 'object'
          ? (event.image as Media)
          : null;
      const isBook = event.eventType === 'bookclub';
      const needsFallback = !image?.url || richTextIsEmpty(event.description);

      // Same poster / summary fallbacks as the event card.
      let book = null;
      let bookCover: string | null = null;
      if (isBook && needsFallback) {
        book = event.openLibraryId
          ? await fetchBookDataByOpenLibraryId(event.openLibraryId)
          : null;
        bookCover = book?.cover || null;
        if (!bookCover && event.bookTitle && event.bookAuthor) {
          bookCover =
            (await searchBookByTitleAuthor(event.bookTitle, event.bookAuthor))
              ?.cover || null;
        }
      }
      const movie =
        !isBook && event.imdbId && needsFallback
          ? await fetchMovieDataByImdbId(event.imdbId)
          : null;

      const description = richTextIsEmpty(event.description)
        ? (book?.description ?? movie?.plot ?? '')
        : richTextToPlain(event.description);

      const paid = isPaidEventType(event.eventType);
      return {
        id: event.id,
        eventType: event.eventType,
        eventTypeName: EVENT_TYPE_NAMES[event.eventType],
        name: event.name,
        start: new Date(event.datetime).toISOString(),
        end: eventCalendarEnd(
          event.datetime,
          await getEventRuntimeMinutes(event)
        ).toISOString(),
        timeZone: 'America/New_York',
        venue: location
          ? {
              name: location.name,
              address: location.address,
              city: location.city,
              state: location.state,
              zip: location.zip,
              url: location.url,
            }
          : null,
        description,
        posterUrl: absoluteUrl(image?.url) ?? bookCover ?? movie?.poster ?? null,
        price: event.price ?? 0,
        eventUrl: paid ? `${ZVC_SITE_URL}/events/${event.id}` : AHC_SITE_URL,
        ticketUrl: paid && event.paymentLink ? event.paymentLink : null,
        updatedAt: event.updatedAt,
      };
    })
  );

  return NextResponse.json(
    { generatedAt: new Date().toISOString(), events },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    }
  );
}
