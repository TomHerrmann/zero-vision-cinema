import { Metadata } from 'next';
import EventsSection from '@/components/events-section/events-section';
import JoinSection from '@/components/join-section/join-section';
import { getUpcomingZvcEvents } from '@/utils/getEvents';

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
  const events = await getUpcomingZvcEvents();

  return (
    <>
      <JoinSection as="h1" />
      {events.length > 0 && <EventsSection events={events} showMoreLink />}
    </>
  );
}
