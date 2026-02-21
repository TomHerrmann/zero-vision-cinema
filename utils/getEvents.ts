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
    alt: '',
    updatedAt: '2026-02-23 13:20:14.227+00',
    createdAt: '2026-02-23 13:20:14.227+00',
    url: 'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/UP_5YR_FocalPoint_2.jpg',
  };

  const location: Location = {
    id: 2,
    name: 'Focal Point Beer Co',
    address: '43-50 12th St',
    city: 'Long Island City',
    state: 'NY',
    zip: 11101,
    url: 'https://www.focalpoint.beer/',
    updatedAt: '2025-06-01 17:20:14.193+00',
    createdAt: '2025-06-01 17:20:14.227+00',
  };

  const staticDoc: Event = {
    id: 10000,
    name: 'Uncle Peckerhead | 5th Anniversary Screening',
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
    price: 15,
    location,
    paymentLink:
      'https://www.eventbrite.com/e/uncle-peckerhead-5-year-anniversary-screening-at-focal-point-beer-co-tickets-1981499252605',
    ticketLimit: 100,
    ticketsSold: 0,
    datetime: '2026-03-22 18:00:00.000+0000',
    updatedAt: '2026-02-21 18:38:53.855+00',
    createdAt: '2026-02-21 18:38:53.855+00',
  };
  console.log(
    { staticDoc },
    'Should show: ',
    staticDoc.datetime > nowMinus30Minutes
  );

  if (new Date(staticDoc.datetime) > new Date(nowMinus30Minutes)) {
    docs.push(staticDoc);
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
