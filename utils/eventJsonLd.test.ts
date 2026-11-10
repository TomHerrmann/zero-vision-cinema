import { describe, it, expect } from 'vitest';
import type { Event } from '@/payload-types';
import { eventJsonLd, jsonLdString } from './eventJsonLd';

const base = {
  id: 12,
  name: 'Possession (1981)',
  eventType: 'zvc',
  datetime: '2026-11-20T00:00:00.000Z',
  price: 13,
  ticketsSold: 0,
  location: {
    name: 'The Ditty',
    address: '1 Main St',
    city: 'Queens',
    state: 'NY',
    zip: 11103,
    capacity: 40,
  },
} as unknown as Event;

describe('eventJsonLd', () => {
  it('builds a schema.org Event with venue and offer', () => {
    const ld = eventJsonLd(base, { image: 'https://img/p.jpg' });
    expect(ld['@type']).toBe('Event');
    expect(ld.startDate).toBe('2026-11-20T00:00:00.000Z');
    expect(ld.url).toBe('https://www.zerovisioncinema.com/events/12');
    expect(ld.location?.address.postalCode).toBe('11103');
    expect(ld.offers).toMatchObject({
      price: '13.00',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    });
    expect(ld.image).toEqual(['https://img/p.jpg']);
  });

  it('marks a full event as sold out and a free one at $0', () => {
    expect(
      eventJsonLd({ ...base, ticketsSold: 40 } as Event).offers.availability
    ).toBe('https://schema.org/SoldOut');
    expect(
      eventJsonLd({ ...base, eventType: 'bookclub', price: 0 } as Event).offers
        .price
    ).toBe('0.00');
  });

  it('escapes < so content cannot close the script tag', () => {
    expect(jsonLdString({ name: '</script>' })).not.toContain('</script>');
  });
});
