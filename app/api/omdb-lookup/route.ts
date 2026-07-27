import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { fetchMovieDataByImdbId } from '@/lib/omdb';
import { plotToLexical } from '@/utils/omdbFill';

/**
 * Admin-only helper for the IMDb-ID field component: given an IMDb id, returns
 * the derived event name, a Lexical description built from the plot, and the
 * poster URL for a confirmation preview. The poster is NOT stored — pages fall
 * back to the OMDB poster URL at render time when no image is set — so nothing
 * is copied into blob storage.
 */
export async function GET(req: NextRequest) {
  const imdbId = req.nextUrl.searchParams.get('imdbId')?.trim();

  const payload = await getPayload({ config: payloadConfig });

  // Admin-only: this endpoint reads our OMDB key.
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!imdbId || !/^tt\d+$/.test(imdbId)) {
    return NextResponse.json(
      { error: 'Provide a valid IMDb id (e.g. tt0088247).' },
      { status: 400 }
    );
  }

  const movie = await fetchMovieDataByImdbId(imdbId);
  if (!movie?.title) {
    return NextResponse.json({ found: false }, { status: 200 });
  }

  const name = movie.year ? `${movie.title} (${movie.year})` : movie.title;
  const description = movie.plot ? plotToLexical(movie.plot) : undefined;

  return NextResponse.json({
    found: true,
    name,
    description,
    poster: movie.poster || null,
    plot: movie.plot || null,
    title: movie.title,
    year: movie.year,
  });
}
