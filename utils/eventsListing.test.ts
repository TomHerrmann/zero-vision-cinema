import { describe, it, expect } from 'vitest';
import type { Event } from '@/payload-types';
import type { HalloweekSlot } from '@/app/(frontend)/halloweek2026/halloweek.data';
import { buildEventListing } from './eventsListing';

const event = (id: number, eventType: Event['eventType'], datetime: string) =>
  ({ id, eventType, name: `Event ${id}`, datetime }) as Event;

const slot = (id: string, datetime: string) =>
  ({
    id,
    datetime,
    title: id,
    description: '',
    venueName: 'QED',
  }) as HalloweekSlot;

const NOW = new Date('2026-10-26T12:00:00-04:00');

describe('buildEventListing', () => {
  it('lists every event type and Halloweek slots in date order', () => {
    const listing = buildEventListing(
      [
        event(1, 'zvc', '2026-11-04T19:30:00-05:00'),
        event(2, 'bookclub', '2026-10-27T19:00:00-04:00'),
        event(3, 'rww', '2026-11-11T19:30:00-05:00'),
      ],
      [slot('brewscares', '2026-10-29T19:30:00-04:00')],
      NOW
    );

    expect(
      listing.map((item) =>
        item.kind === 'event' ? item.event.eventType : item.slot.id
      )
    ).toEqual(['bookclub', 'brewscares', 'zvc', 'rww']);
  });

  it('drops past events and slots, keeping ones within 30 minutes of start', () => {
    const listing = buildEventListing(
      [
        event(1, 'ahc', '2026-10-26T11:40:00-04:00'),
        event(2, 'ahc', '2026-10-26T11:00:00-04:00'),
      ],
      [
        slot('started-recently', '2026-10-26T11:45:00-04:00'),
        slot('scary-streets', '2026-10-24T19:00:00-04:00'),
      ],
      NOW
    );

    expect(listing).toHaveLength(2);
    expect(listing.map((item) => item.datetime)).toEqual([
      '2026-10-26T11:40:00-04:00',
      '2026-10-26T11:45:00-04:00',
    ]);
  });

  it('keeps the Payload event when a Halloweek slot starts the same minute', () => {
    const listing = buildEventListing(
      // Payload stores UTC; the slot carries the Eastern offset.
      [event(1, 'ahc', '2026-10-26T23:00:00.000Z')],
      [slot('astoria-horror-club', '2026-10-26T19:00:00-04:00')],
      NOW
    );

    expect(listing).toHaveLength(1);
    expect(listing[0].kind).toBe('event');
  });
});
