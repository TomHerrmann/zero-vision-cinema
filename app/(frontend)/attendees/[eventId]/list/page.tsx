// app/attendees/[eventId]/list/page.tsx

import { Metadata } from 'next';

interface AttendeesListPageProps {
  params: { eventId: string };
}

export const metadata: Metadata = {
  title: 'Attendee List',
};

export default async function AttendeesListPage({
  params,
}: AttendeesListPageProps) {
  const { eventId } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/attendees?eventId=${eventId}`,
    {
      cache: 'no-store',
    }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch attendees');
  }

  const { attendees } = await res.json();
  console.log('*****', attendees);
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Attendees for Event: {eventId}</h1>
      <p className="mt-2 text-stone-100">This page will list attendees.</p>
    </main>
  );
}
