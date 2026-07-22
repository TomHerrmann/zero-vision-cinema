import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';
import { NextResponse } from 'next/server';

// One-off backfill for the Movies feature. Kept out of app/ so it isn't a live
// endpoint. To run: copy this file to `app/api/backfill-movies/route.ts`, start
// `npm run dev`, hit `GET /api/backfill-movies`, then delete it.
//
// Setting `imdbId` on an event triggers the Events beforeChange hook, which
// generates the slug and find-or-creates the shared Movie (fetching OMDB).

const IMDB_BY_MATCH: { test: RegExp; imdbId: string }[] = [
  { test: /friday the 13th/i, imdbId: 'tt0082418' },
  { test: /terminator 2/i, imdbId: 'tt0103064' },
];

export async function GET() {
  const payload = await getPayload({ config: payloadConfig });

  const { docs: events } = await payload.find({
    collection: 'events',
    limit: 200,
    pagination: false,
    depth: 0,
  });

  const results: { id: number; name: string; imdbId?: string; status: string }[] = [];

  for (const event of events) {
    const match = IMDB_BY_MATCH.find((m) => m.test.test(event.name));
    if (!match) {
      results.push({ id: event.id, name: event.name, status: 'skipped (no imdb match)' });
      continue;
    }

    try {
      await payload.update({
        collection: 'events',
        id: event.id,
        data: { imdbId: match.imdbId },
      });
      results.push({
        id: event.id,
        name: event.name,
        imdbId: match.imdbId,
        status: 'updated',
      });
    } catch (err) {
      results.push({
        id: event.id,
        name: event.name,
        imdbId: match.imdbId,
        status: `error: ${err}`,
      });
    }
  }

  return NextResponse.json({ results });
}
