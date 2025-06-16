import { cookies } from 'next/headers';
import NoAccess from '../notice';

import EventList from '@/components/event-list/event-list';
import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';

export default async function AttendeesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('payload-token')?.value;

  if (!token) {
    return <NoAccess />;
  }

  const payload = await getPayload({ config: payloadConfig });

  const { docs: events } = await payload.find({
    collection: 'events',
    limit: 100,
    depth: 1,
  });

  return (
    <main className="flex flex-col m-5 mb-12 md:py-12 md:px-24 md:my-12 md:mx-24">
      <h1 className="text-4xl text-center font-bold mb-12">Attendees Lists</h1>
      <EventList events={events} />
    </main>
  );
}
