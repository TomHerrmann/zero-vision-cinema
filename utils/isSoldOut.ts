import type { Event } from '@/payload-types';
import type { Location } from '@/payload-types';

export const isSoldOut = (event: Event) => {
  const ticketsSold = event.ticketsSold ?? 0;
  const capacity = (event.location as Location)?.capacity ?? 0;
  if (event.price === 0 || capacity === 0) return false;

  return ticketsSold >= capacity;
};
