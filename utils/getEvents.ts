import payloadConfig from '@/payload.config';
import { getPayload } from 'payload';
import { COMMUNITY_EVENT_TYPES, PAID_EVENT_TYPES } from '@/utils/eventTypes';

const payload = await getPayload({ config: payloadConfig });

const nowMinus30Minutes = new Date(Date.now() - 30 * 60 * 1000).toISOString();
const now = new Date().toISOString();

export const getUpcomingZvcEvents = async () => {
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      _status: {
        equals: 'published',
      },
      eventType: {
        equals: 'zvc',
      },
      datetime: {
        greater_than: nowMinus30Minutes,
      },
    },
    sort: ['datetime'],
    depth: 1,
  });

  return docs;
};

/** A published ticketed event (ZVC or Brewscares), for its ticket page. */
export const getPaidEventById = async (id: number) => {
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      _status: { equals: 'published' },
      id: { equals: id },
      eventType: { in: [...PAID_EVENT_TYPES] },
    },
    // depth 2 resolves image + location.
    depth: 2,
    limit: 1,
  });

  return docs[0] ?? null;
};

export const getAllZvcEvents = async () => {
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      _status: {
        equals: 'published',
      },
      eventType: {
        equals: 'zvc',
      },
    },
    sort: ['datetime'],
    depth: 1,
  });

  return docs;
};

export const getPastZvcEvents = async () => {
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      _status: {
        equals: 'published',
      },
      eventType: {
        equals: 'zvc',
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

/** Upcoming Astoria Horror Club events (free), for the AHC page. */
export const getUpcomingAhcEvents = async () => {
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      _status: {
        equals: 'published',
      },
      eventType: {
        equals: 'ahc',
      },
      datetime: {
        greater_than: nowMinus30Minutes,
      },
    },
    sort: ['datetime'],
    depth: 1,
  });

  return docs;
};

/** Upcoming Astoria Horror Book Club events (free), for the AHC page. */
export const getUpcomingBookClubEvents = async () => {
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      _status: {
        equals: 'published',
      },
      eventType: {
        equals: 'bookclub',
      },
      datetime: {
        greater_than: nowMinus30Minutes,
      },
    },
    sort: ['datetime'],
    depth: 1,
  });

  return docs;
};

/**
 * Upcoming community nights (Rewind Wednesdays, Fridays at Medusa, Brewscares,
 * Bingo, Horror Brunch), for the AHC page.
 */
export const getUpcomingCommunityEvents = async () => {
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      _status: {
        equals: 'published',
      },
      eventType: {
        in: [...COMMUNITY_EVENT_TYPES],
      },
      datetime: {
        greater_than: nowMinus30Minutes,
      },
    },
    sort: ['datetime'],
    depth: 1,
  });

  return docs;
};
