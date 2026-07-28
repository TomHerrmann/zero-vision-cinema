import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import {
  searchBookByTitleAuthor,
  fetchBookDataByOpenLibraryId,
} from '@/lib/openlibrary';

/**
 * Admin-only helper for the book title/author fields: given a title + author,
 * searches Open Library, returns the work id (to store), a derived event name,
 * and cover/description for a confirmation preview. The cover is referenced from
 * Open Library at render time — nothing is copied into blob storage.
 */
export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get('title')?.trim();
  const author = req.nextUrl.searchParams.get('author')?.trim();

  const payload = await getPayload({ config: payloadConfig });

  // Admin-only.
  const { user } = await payload.auth({ headers: req.headers });
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!title || !author) {
    return NextResponse.json(
      { error: 'Provide both a book title and author.' },
      { status: 400 }
    );
  }

  const match = await searchBookByTitleAuthor(title, author);
  if (!match) {
    return NextResponse.json({ found: false }, { status: 200 });
  }

  // Pull the description from the work record for the preview.
  const book = await fetchBookDataByOpenLibraryId(match.workId);

  return NextResponse.json({
    found: true,
    openLibraryId: match.workId,
    name: `${match.title} — ${match.author}`,
    cover: match.cover || book?.cover || null,
    description: book?.description || null,
    title: match.title,
    author: match.author,
    year: match.year,
  });
}
