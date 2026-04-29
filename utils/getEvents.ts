import payloadConfig from '@/payload.config';
import { getPayload } from 'payload';
import type { Event, Location, Media } from '@/payload-types';

const payload = await getPayload({ config: payloadConfig });

const nowMinus30Minutes = new Date(Date.now() - 30 * 60 * 1000).toISOString();
const now = new Date().toISOString();

export const getUpcomingEvents = async () => {
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      _status: {
        equals: 'published',
      },
      datetime: {
        greater_than: nowMinus30Minutes,
      },
    },
    sort: ['datetime'],
    depth: 1,
  });

  const image: Media = {
    id: 0,
    alt: 'zvc anniverary show poster',
    updatedAt: '2026-02-23 13:20:14.227+00',
    createdAt: '2026-02-23 13:20:14.227+00',
    url: 'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/ZERO%20VISION%20CINEMA%201%20YEAR%20ANNIVERSARY%20SHOW.png',
  };

  const location: Location = {
    id: 3,
    name: 'SingleCut Beersmiths QNS',
    address: '19-33 37th St',
    city: 'Astoria',
    state: 'NY',
    zip: 11105,
    url: 'https://www.singlecut.com/',
    updatedAt: '2025-06-01 17:20:14.193+00',
    createdAt: '2025-06-01 17:20:14.227+00',
  };

  const staticDoc: Event = {
    id: 10000,
    name: 'ZVC 1 Year Anniverary Show',
    description: {
      root: {
        type: '',
        children: [],
        direction: null,
        format: '',
        indent: 0,
        version: 0,
      },
    },
    image,
    price: 0,
    location,
    paymentLink:
      'https://www.eventbrite.com/e/uncle-peckerhead-5-year-anniversary-screening-at-focal-point-beer-co-tickets-1981499252605',
    ticketLimit: 100,
    ticketsSold: 0,
    datetime: '2026-05-06 19:00:00.000+0000',
    updatedAt: '2026-02-21 18:38:53.855+00',
    createdAt: '2026-02-21 18:38:53.855+00',
  };

  if (new Date(staticDoc.datetime) > new Date(nowMinus30Minutes)) {
    docs.push(staticDoc);
    docs.sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );
  }

  return docs;
};

export const getAllEvents = async () => {
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      _status: {
        equals: 'published',
      },
    },
    sort: ['datetime'],
    depth: 1,
  });

  return docs;
};

export const getPastEvents = async () => {
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      _status: {
        equals: 'published',
      },
      datetime: {
        less_than: now,
      },
    },
    sort: ['-datetime'],
    depth: 1,
  });

  return docs;
};
