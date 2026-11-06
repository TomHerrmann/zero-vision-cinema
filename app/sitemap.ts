import type { MetadataRoute } from 'next';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { ZVC_CANONICAL_URL } from '@/app/contsants/constants';
import { INDEXED_EVENT_TYPES } from '@/utils/eventTypes';
import { CLOSES_AFTER_MINUTES } from '@/utils/eventEnded';

/**
 * Generated from Payload on each revalidate, so new screenings and Book Club
 * meetings are listed without a deploy. Only event types in
 * INDEXED_EVENT_TYPES get their pages listed; the Astoria Horror Club page
 * stays out (it's noindexed).
 */
export const revalidate = 3600;

const STATIC_PATHS = [
  '/',
  '/events',
  '/halloweek2026',
  '/join',
  '/links',
  '/press',
  '/privacy',
  '/terms',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) =>
    `${ZVC_CANONICAL_URL}${path === '/' ? '' : path}`;
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: url(path),
    changeFrequency: path === '/' || path === '/events' ? 'daily' : 'monthly',
  }));

  const payload = await getPayload({ config: payloadConfig });
  // Event pages redirect to /events an hour after the start, so only list
  // events that haven't closed yet.
  const openAfter = new Date(
    Date.now() - CLOSES_AFTER_MINUTES * 60 * 1000
  ).toISOString();

  const [events, articles] = await Promise.all([
    payload.find({
      collection: 'events',
      where: {
        _status: { equals: 'published' },
        eventType: { in: [...INDEXED_EVENT_TYPES] },
        datetime: { greater_than: openAfter },
      },
      depth: 0,
      limit: 500,
      pagination: false,
    }),
    payload.find({
      collection: 'articles',
      where: { _status: { equals: 'published' } },
      depth: 0,
      limit: 1000,
      pagination: false,
    }),
  ]);

  for (const event of events.docs) {
    entries.push({
      url: url(`/events/${event.id}`),
      lastModified: event.updatedAt,
      changeFrequency: 'daily',
    });
  }

  for (const article of articles.docs) {
    if (!article.slug) continue;
    const base =
      article.category === 'review'
        ? '/reviews'
        : article.category === 'editorial'
          ? '/editorials'
          : null;
    if (!base) continue;
    entries.push({
      url: url(`${base}/${article.slug}`),
      lastModified: article.updatedAt,
      changeFrequency: 'monthly',
    });
  }

  return entries;
}
