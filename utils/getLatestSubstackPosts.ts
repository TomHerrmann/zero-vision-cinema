import { ZVC_SUBSTACK_URL } from '@/app/contsants/constants';

export type SubstackPost = {
  title: string;
  subtitle: string | null;
  url: string;
  imageUrl: string | null;
  /** ISO timestamp */
  publishedAt: string | null;
};

const FEED_URL = new URL('feed', ZVC_SUBSTACK_URL).toString();

// Substack's CDATA text still carries HTML entities (e.g. &#8217; for ’).
const decodeEntities = (text: string) =>
  text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16))
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

const readTag = (xml: string, tag: string) => {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!match) return null;
  const raw = match[1].replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, '$1').trim();
  return raw ? decodeEntities(raw) : null;
};

const parseItem = (item: string): SubstackPost | null => {
  const title = readTag(item, 'title');
  const url = readTag(item, 'link');
  if (!title || !url) return null;

  const pubDate = readTag(item, 'pubDate');
  const published = pubDate ? new Date(pubDate) : null;

  return {
    title,
    subtitle: readTag(item, 'description'),
    url,
    // Cover image rides along as the item's <enclosure url="…">.
    imageUrl: item.match(/<enclosure[^>]*\surl="([^"]+)"/)?.[1] ?? null,
    publishedAt:
      published && !isNaN(published.getTime())
        ? published.toISOString()
        : null,
  };
};

/**
 * Newest `limit` posts from the ZVC Substack RSS feed (items are newest-first).
 * Returns [] instead of throwing so a Substack outage never breaks a page.
 */
export const getLatestSubstackPosts = async (
  limit = 1
): Promise<SubstackPost[]> => {
  try {
    const res = await fetch(FEED_URL, { next: { revalidate: 300 } });
    if (!res.ok) return [];

    const xml = await res.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

    return items
      .map(parseItem)
      .filter((post): post is SubstackPost => post !== null)
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to fetch Substack posts', error);
    return [];
  }
};
