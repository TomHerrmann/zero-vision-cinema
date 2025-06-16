'use client';

import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowDownUp } from 'lucide-react';
import { Input } from '../ui/input';
import { useState } from 'react';

type Event = {
  id: number;
  name: string;
  datetime: string;
  ticketsSold?: number | null | undefined;
  ticketLimit?: number | null | undefined;
};

type Props = {
  events: Event[];
};

export default function EventList({ events }: Props) {
  const [searchVal, setSearchVal] = useState('');

  const sortedEvents = [...events];

  return (
    <>
      <div className="flex justify-between md:w-3/4">
        <h2 className="text-3xl font-bold mb-12">Events</h2>
      </div>
      {events.length === 0 ? (
        <p>No upcoming events</p>
      ) : (
        <ul className="space-y-4 md:w-3/4">
          {sortedEvents
            .filter(({ name }) => name.includes(searchVal.toLowerCase()))
            .map((event) => (
              <li
                key={event.id}
                className="border p-1 md:p-4 gap-2 rounded bg-stone-800 flex flex-col md:flex-row justify-between"
              >
                <div>
                  <h2 className="text-xl font-semibold">{event.name}</h2>
                  <p>{event.datetime}</p>
                  <p>Tickets Sold: {event.ticketsSold}</p>
                  {(event.ticketsSold ?? 0) >= (event.ticketLimit ?? 0) && (
                    <strong>SOLD OUT</strong>
                  )}
                </div>
                <Button className="m-4" asChild>
                  <Link href={`/attendees/${event.id}/list`}>
                    View Attendees
                  </Link>
                </Button>
              </li>
            ))}
        </ul>
      )}
    </>
  );
}
