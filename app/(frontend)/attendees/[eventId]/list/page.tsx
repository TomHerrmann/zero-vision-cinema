// app/attendees/[eventId]/list/page.tsx

import { Metadata } from 'next';

interface AttendeesListPageProps {
  params: { eventId: string };
}

export const metadata: Metadata = {
  title: 'Attendee List',
};

export default function AttendeesListPage({ params }: AttendeesListPageProps) {
  const { eventId } = params;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Attendees for Event: {eventId}</h1>
      <p className="mt-2 text-gray-600">This page will list attendees.</p>
    </main>
  );
}
