/**
 * OMDB API helper.
 */

export type MovieData = {
  title: string;
  year: string;
  rated: string;
  runtime: string;
  genre: string;
  director: string;
  actors: string;
  plot: string;
  imdbRating: string;
  poster: string;
};

type OmdbResponse = Partial<Record<string, string>> & {
  Response: 'True' | 'False';
  Error?: string;
};

const clean = (v: string | undefined): string => (v && v !== 'N/A' ? v : '');

/**
 * OMDB posters come back capped at 300px wide (`._V1_SX300.jpg`). The same
 * Amazon image is available at full resolution by rewriting the size token —
 * request ~1000px so next/image has enough resolution for retina displays.
 * Non-matching or empty URLs pass through unchanged.
 */
const highResPoster = (url: string): string =>
  url ? url.replace(/(\._V1_)[^/]*?(\.jpg)$/i, '$1SX1000$2') : url;

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;
/**
 * Fetch a movie from OMDB by its IMDb id (e.g. "tt0082418") and normalize it.
 * Returns null if the key is missing or OMDB has no match.
 */
export async function fetchMovieDataByImdbId(
  imdbId: string
): Promise<MovieData | null> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey || !imdbId) return null;

  const url = `https://www.omdbapi.com/?i=${encodeURIComponent(
    imdbId
  )}&plot=short&apikey=${apiKey}`;

  const res = await fetch(url, {
    next: { revalidate: THIRTY_DAYS_IN_SECONDS },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as OmdbResponse;
  if (data.Response !== 'True') return null;

  return {
    title: clean(data.Title),
    year: clean(data.Year),
    rated: clean(data.Rated),
    runtime: clean(data.Runtime),
    genre: clean(data.Genre),
    director: clean(data.Director),
    actors: clean(data.Actors),
    plot: clean(data.Plot),
    imdbRating: clean(data.imdbRating),
    poster: highResPoster(clean(data.Poster)),
  };
}
