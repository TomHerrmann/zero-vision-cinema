import { fetchMovieDataByImdbId } from '@/lib/omdb';
import { parseRuntimeMinutes } from '@/utils/eventCalendar';

/**
 * The film's runtime in minutes, from OMDB (cached 30 days), or null when the
 * event has no IMDb id or OMDB doesn't list one — callers then fall back to
 * the default runtime in `utils/eventCalendar.ts`.
 */
export async function getEventRuntimeMinutes(event: {
  imdbId?: string | null;
}): Promise<number | null> {
  if (!event.imdbId) return null;
  try {
    const movie = await fetchMovieDataByImdbId(event.imdbId);
    return parseRuntimeMinutes(movie?.runtime);
  } catch {
    return null;
  }
}
