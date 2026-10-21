import { Metadata } from 'next';
import EventsSection from '@/components/events-section/events-section';
import JoinSection from '@/components/join-section/join-section';
import { getUpcomingEvents } from '@/utils/getEvents';
import { buildEventListing } from '@/utils/eventsListing';
import { HALLOWEEK_SCHEDULE } from '@/app/(frontend)/halloweek2026/halloweek.data';

// Revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Join — Zero Vision Cinema',
  description:
    'A pop-up movie theater, screening niche movies, genre films, and cult favorites around NYC.',
};

/**
 * The one link for bios, QR codes and newsletters. Tag each with its own
 * utm_source (/join?utm_source=ig) so signups record where they came from.
 */
export default async function JoinPage() {
  const events = buildEventListing(
    await getUpcomingEvents(),
    HALLOWEEK_SCHEDULE
  );

  return (
    <>
      <JoinSection as="h1" />
      {events.length > 0 && <EventsSection events={events} showMoreLink />}
    </>
  );
}
