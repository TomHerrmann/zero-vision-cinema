import { Metadata } from 'next';
import { cookies } from 'next/headers';

import { PageProps } from '@/.next/types/app/(frontend)/page';
import { AttendeesTable } from '@/components/attendees-table/attendees-table';

export const metadata: Metadata = {
  title: 'Attendee List',
};

export default async function AttendeesListPage({ params }: PageProps) {
  const { eventid } = await params;

  const cookieStore = await cookies();
  const token = await cookieStore.get('payload-token')?.value;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/attendees?eventid=${eventid}`,
    {
      headers: { Authorization: `JWT ${token}` },
      cache: 'no-store',
      credentials: 'include',
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
