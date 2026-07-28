/**
 * Open Library API helper — the book-club analogue of lib/omdb.ts. We store the
 * Open Library work id on the Event and re-fetch cover/description at render
 * time (cached), so nothing is copied into blob storage.
 */

export type BookSearchResult = {
  workId: string; // e.g. "OL81633W"
  title: string;
  author: string;
  year: string;
  cover: string; // full covers.openlibrary.org URL, or ''
};

export type BookData = {
  cover: string;
  description: string;
};

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

const coverUrl = (coverId: number | undefined | null): string =>
  coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : '';

/** Bare work id ("OL81633W") from a work key ("/works/OL81633W" or "OL81633W"). */
const toWorkId = (key: string): string => key.replace(/^\/works\//, '');

/**
 * Search Open Library for the best title+author match. Returns the work id and
 * display fields, or null if there's no match / on error.
 */
export async function searchBookByTitleAuthor(
  title: string,
  author: string
): Promise<BookSearchResult | null> {
  if (!title || !author) return null;

  const url =
    `https://openlibrary.org/search.json?title=${encodeURIComponent(title)}` +
    `&author=${encodeURIComponent(author)}&limit=1` +
    `&fields=key,title,author_name,first_publish_year,cover_i`;

  try {
    const res = await fetch(url, { next: { revalidate: THIRTY_DAYS_IN_SECONDS } });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      docs?: Array<{
        key?: string;
        title?: string;
        author_name?: string[];
        first_publish_year?: number;
        cover_i?: number;
      }>;
    };
    const doc = data.docs?.[0];
    if (!doc?.key || !doc.title) return null;

    return {
      workId: toWorkId(doc.key),
      title: doc.title,
      author: doc.author_name?.[0] ?? author,
      year: doc.first_publish_year ? String(doc.first_publish_year) : '',
      cover: coverUrl(doc.cover_i),
    };
  } catch {
    return null;
  }
}

/**
 * Fetch a book's cover + description by its Open Library work id (e.g.
 * "OL81633W"), for render-time display. Cached 30 days. Null on error.
 */
export async function fetchBookDataByOpenLibraryId(
  workId: string
): Promise<BookData | null> {
  if (!workId) return null;
  const id = toWorkId(workId);

  try {
    const res = await fetch(`https://openlibrary.org/works/${id}.json`, {
      next: { revalidate: THIRTY_DAYS_IN_SECONDS },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      covers?: number[];
      description?: string | { value?: string };
    };

    const description =
      typeof data.description === 'string'
        ? data.description
        : (data.description?.value ?? '');

    return {
      cover: coverUrl(data.covers?.[0]),
      description,
    };
  } catch {
    return null;
  }
}
