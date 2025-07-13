import payloadConfig from '@/payload.config';
import { getPayload } from 'payload';

const payload = await getPayload({ config: payloadConfig });

const nowPlus1Hour = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString();
const now = new Date().toISOString();

export const getUpcomingEvents = async () => {
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      _status: {
        equals: 'published',
      },
      datetime: {
        greater_than: nowPlus1Hour,
      },
    },
    sort: ['datetime'],
    depth: 1,
  });

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
