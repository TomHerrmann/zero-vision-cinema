import { getPayload } from 'payload';
import { cookies } from 'next/headers';
import { format } from 'date-fns';
import NoAccess from '../notice';
import payloadConfig from '../../../payload.config';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import EventList from '@/components/event-list/event-list';

export default async function AttendeesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('payload-token')?.value;

  if (!token) {
    return <NoAccess />;
  }

  return (
    <main className="flex flex-col m-5 mb-12 md:py-12 md:px-24 md:my-12 md:mx-24">
      <h1 className="text-4xl text-center font-bold mb-12">Attendees Lists</h1>
      <h2 className="text-3xl font-bold mb-12">Events</h2>
      <EventList selection={'future'} order={'dsc'} />
    </main>
  );
}
