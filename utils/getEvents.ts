import payloadConfig from '@/payload.config';
import { getPayload } from 'payload';
import {
  COMMUNITY_EVENT_TYPES,
  EVENT_PAGE_TYPES,
} from '@/utils/eventTypes';

const payload = await getPayload({ config: payloadConfig });

// Functions, not constants: this module stays loaded between requests, so a
// timestamp taken at import time would freeze and let past events linger.
const nowMinus30Minutes = () =>
  new Date(Date.now() - 30 * 60 * 1000).toISOString();
const now = () => new Date().toISOString();

/**
 * Every published event of every type that hasn't started yet (or started in
 * the last 30 minutes), for the /events page.
 */
export const getUpcomingEvents = async () => {
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      _status: {
        equals: 'published',
      },
      datetime: {
        greater_than: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      },
    },
    sort: ['datetime'],
    depth: 1,
    pagination: false,
  });

  return docs;
};

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
        greater_than: nowMinus30Minutes(),
      },
    },
    sort: ['datetime'],
    depth: 1,
  });

  return docs;
};

/**
 * A published event that has its own page: ticketed types (ZVC, Brewscares)
 * plus Book Club meetings (free, no checkout).
 */
export const getEventPageById = async (id: number) => {
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      _status: { equals: 'published' },
      id: { equals: id },
      eventType: { in: [...EVENT_PAGE_TYPES] },
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
        less_than: now(),
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
        greater_than: nowMinus30Minutes(),
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
        greater_than: nowMinus30Minutes(),
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
        greater_than: nowMinus30Minutes(),
      },
    },
    sort: ['datetime'],
    depth: 1,
  });

  return docs;
};
