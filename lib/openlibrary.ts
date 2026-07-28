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

type OLDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
};

async function olSearch(params: string): Promise<OLDoc[]> {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?${params}` +
        `&fields=key,title,author_name,first_publish_year,cover_i`,
      { next: { revalidate: THIRTY_DAYS_IN_SECONDS } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { docs?: OLDoc[] };
    return data.docs ?? [];
  } catch {
    return [];
  }
}

/**
 * Find the best Open Library match for a book, tolerant of Open Library's data
 * quirks. Tries progressively looser searches and takes the first hit:
 *   1. `title + author` — precise (e.g. The Shining / Stephen King).
 *   2. `title` only — catches romanized-author works (Open Library stores
 *      "Cursed Bunny" under author "Pora Chŏng", so tier 1 misses it).
 *   3. `q=` free-text — last resort for books whose *work* is titled in the
 *      original language ("Tender is the Flesh" → work "Cadáver exquisito").
 * Within a tier, prefer a result that has a cover. Returns null if nothing hits.
 * Callers display the user's typed title/author for the name; this result is
 * only used for the work id, cover, and description.
 */
export async function searchBookByTitleAuthor(
  title: string,
  author: string
): Promise<BookSearchResult | null> {
  if (!title) return null;
  const enc = encodeURIComponent;
  const pick = (docs: OLDoc[]) => docs.find((d) => d.cover_i) ?? docs[0];

  // Try each tier; a result WITH a cover wins immediately (Open Library often
  // splits translations into a coverless work + a covered original-language
  // work — we want the covered one). Otherwise keep the first hit as a fallback.
  const tiers = [
    author ? `title=${enc(title)}&author=${enc(author)}&limit=5` : null,
    `title=${enc(title)}&limit=5`,
    `q=${enc(`${title} ${author}`.trim())}&limit=5`,
  ].filter((t): t is string => t !== null);

  let fallback: OLDoc | undefined;
  for (const params of tiers) {
    const doc = pick(await olSearch(params));
    if (doc?.cover_i) {
      fallback = doc;
      break;
    }
    if (doc && !fallback) fallback = doc;
  }

  const doc = fallback;
  if (!doc?.key || !doc.title) return null;

  return {
    workId: toWorkId(doc.key),
    title: doc.title,
    author: doc.author_name?.[0] ?? author,
    year: doc.first_publish_year ? String(doc.first_publish_year) : '',
    cover: coverUrl(doc.cover_i),
  };
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
