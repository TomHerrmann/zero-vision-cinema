import { Metadata } from 'next';
import { cookies, headers } from 'next/headers';
import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';
import { AttendeesTable } from '@/components/attendees-table/attendees-table';
import NoAccess from '../../../notice';

export const metadata: Metadata = {
  title: 'Attendee List',
  robots: { index: false, follow: false },
};

type Props = {
  // Matches the `[eventId]` folder name.
  params: Promise<{
    eventId: string;
  }>;
};

export default async function AttendeesListPage({ params }: Props) {
  const { eventId } = await params;

  // Validate the session before fetching customer names and emails.
  const payload = await getPayload({ config: payloadConfig });
  const { user } = await payload.auth({ headers: await headers() });
  if (!user) {
    return <NoAccess />;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('payload-token')?.value;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/attendees?eventid=${encodeURIComponent(eventId)}`,
    {
      headers: { Authorization: `JWT ${token}` },
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch attendees');
  }

  const data = await res.json();
  const attendees: Attendee[] = data.attendees;
  const eventName: string = data.eventName;

  return <AttendeesTable attendees={attendees} eventName={eventName} />;
}
