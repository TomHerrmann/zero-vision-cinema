import type { Event, Location } from '@/payload-types';
import { ZVC_CANONICAL_URL } from '@/app/contsants/constants';
import { eventTitle } from '@/utils/eventTypes';
import { isSoldOut } from '@/utils/isSoldOut';

/**
 * schema.org Event structured data for an event page, so search engines can
 * show it in their event listings. Built only from fields the event already
 * has — no new copy.
 */
export function eventJsonLd(
  event: Event,
  {
    image,
    description,
  }: { image?: string | null; description?: string | null } = {}
) {
  const location =
    event.location && typeof event.location === 'object'
      ? (event.location as Location)
      : null;
  const url = `${ZVC_CANONICAL_URL}/events/${event.id}`;
  const price = event.price ?? 0;

  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: eventTitle(event),
    startDate: new Date(event.datetime).toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    url,
    ...(image ? { image: [image] } : {}),
    ...(description ? { description } : {}),
    ...(location
      ? {
          location: {
            '@type': 'Place',
            name: location.name,
            address: {
              '@type': 'PostalAddress',
              streetAddress: location.address,
              addressLocality: location.city,
              addressRegion: location.state,
              postalCode: String(location.zip),
              addressCountry: 'US',
            },
          },
        }
      : {}),
    organizer: {
      '@type': 'Organization',
      name: 'Zero Vision Cinema',
      url: ZVC_CANONICAL_URL,
    },
    offers: {
      '@type': 'Offer',
      url,
      price: price.toFixed(2),
      priceCurrency: 'USD',
      availability: isSoldOut(event)
        ? 'https://schema.org/SoldOut'
        : 'https://schema.org/InStock',
    },
  };
}

/** Serialize for a <script type="application/ld+json">, safe against `</script>`. */
export const jsonLdString = (data: unknown) =>
  JSON.stringify(data).replace(/</g, '\\u003c');
