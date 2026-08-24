import { fetchMovieDataByImdbId, type MovieData } from '@/lib/omdb';
import { fetchBookDataByOpenLibraryId } from '@/lib/openlibrary';
import { ZVC_SITE_URL, AHC_SITE_URL } from '@/app/contsants/constants';
import type { Event, Location, Media } from '@/payload-types';

export type BroadcastKind = 'announcement' | 'reminder';

/** Resend Topic id for an event type, so recipients can unsubscribe per type. */
export function topicIdForEventType(
  eventType?: string | null
): string | undefined {
  switch (eventType) {
    case 'zvc':
      return process.env.RESEND_TOPIC_ID_ZVC;
    case 'ahc':
      return process.env.RESEND_TOPIC_ID_AHC;
    case 'bookclub':
      return process.env.RESEND_TOPIC_ID_BOOK_CLUB;
    default:
      return undefined;
  }
}

export type BroadcastBookInfo = {
  title?: string;
  author?: string;
  cover?: string;
  description?: string;
};

export type EventBroadcastData = {
  movie: MovieData | null;
  book: BroadcastBookInfo | null;
  posterUrl?: string;
  eventUrl: string;
  location: Location;
  isPaid: boolean;
};

/**
 * Resolve everything a broadcast needs about an event beyond its own columns:
 * OMDB film data (screenings) or Open Library book data (book club), the poster
 * to show, and the URL to link to. Shared by the email and Discord tasks so the
 * two channels can't drift on which poster or link an event gets.
 *
 * The event must already be loaded with `depth: 1` so `location` and `image`
 * are objects rather than ids.
 */
export async function resolveEventBroadcastData(
  event_: Event
): Promise<EventBroadcastData> {
  const isBookClub = event_.eventType === 'bookclub';

  const movie =
    !isBookClub && event_.imdbId
      ? await fetchMovieDataByImdbId(event_.imdbId)
      : null;
  const bookData =
    isBookClub && event_.openLibraryId
      ? await fetchBookDataByOpenLibraryId(event_.openLibraryId)
      : null;
  const book =
    isBookClub && (event_.bookTitle || event_.bookAuthor || bookData)
      ? {
          title: event_.bookTitle ?? undefined,
          author: event_.bookAuthor ?? undefined,
          cover: bookData?.cover,
          description: bookData?.description,
        }
      : null;

  // Poster: uploaded blob image if present, else the OMDB / book cover.
  const image =
    typeof event_.image === 'object' ? (event_.image as Media) : null;
  const posterUrl = image?.filename
    ? `${process.env.VERCEL_BLOB_URL}${image.filename}`
    : movie?.poster || book?.cover || undefined;

  return {
    movie,
    book,
    posterUrl,
    eventUrl:
      event_.eventType === 'zvc'
        ? `${ZVC_SITE_URL}/events/${event_.id}`
        : AHC_SITE_URL,
    location: event_.location as Location,
    isPaid: (event_.price ?? 0) > 0, // paid ZVC vs free AHC / book club
  };
}
