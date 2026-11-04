import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import { fetchMovieDataByImdbId } from '@/lib/omdb';
import { fetchBookDataByOpenLibraryId } from '@/lib/openlibrary';
import { ZVC_SITE_URL } from '@/app/contsants/constants';
import type { WeeklyEvent } from '@/emails/WeeklyEmail';
import type { Event, Location, Media } from '@/payload-types';
import { EVENT_TYPE_NAMES, eventTitle, isPaidEventType } from '@/utils/eventTypes';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Broadcast name in Resend; doubles as the "already sent this week" record. */
export const weeklyBroadcastName = (dateKey: string) =>
  `This week at ZVC ${dateKey}`;

/** Only show the latest video / post if it went up in the week before the send. */
export function postedThisPastWeek(
  publishedAt: string | null | undefined,
  now: Date
): boolean {
  if (!publishedAt) return false;
  const t = new Date(publishedAt).getTime();
  return t <= now.getTime() && now.getTime() - t <= WEEK_MS;
}

export async function toWeeklyEvent(event_: Event): Promise<WeeklyEvent> {
  const isBookClub = event_.eventType === 'bookclub';
  const [movie, book] = await Promise.all([
    !isBookClub && event_.imdbId
      ? fetchMovieDataByImdbId(event_.imdbId)
      : null,
    isBookClub && event_.openLibraryId
      ? fetchBookDataByOpenLibraryId(event_.openLibraryId)
      : null,
  ]);

  const image =
    typeof event_.image === 'object' ? (event_.image as Media) : null;
  const posterUrl = image?.filename
    ? `${process.env.VERCEL_BLOB_URL}${image.filename}`
    : movie?.poster || book?.cover || undefined;

  const location = event_.location as Location | null;
  // Same rule as the per-event broadcast: paid = has a price.
  const paid = (event_.price ?? 0) > 0;

  return {
    id: event_.id,
    typeName: EVENT_TYPE_NAMES[event_.eventType],
    title: eventTitle(event_),
    datetime: event_.datetime,
    venue: location?.name ?? '',
    posterUrl,
    description: (event_.description as SerializedEditorState) ?? null,
    fallbackDescription: book?.description || movie?.plot || null,
    paid,
    ticketUrl:
      paid && isPaidEventType(event_.eventType)
        ? `${ZVC_SITE_URL}/events/${event_.id}`
        : undefined,
    calendarUrl: `${ZVC_SITE_URL}/api/events/${event_.id}/calendar`,
  };
}

