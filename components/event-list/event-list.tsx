import Link from 'next/link';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';

type Props = {
  selection: 'future' | 'past' | 'all';
  order: 'dsc' | 'asc';
};

const getWehreQuery = (selection: Props['selection']) => {
  const now = new Date().toISOString();

  switch (selection) {
    case 'future':
      return {
        datetime: {
          greater_than: now,
        },
      };
    case 'past':
      return {
        datetime: {
          less_than: now,
        },
      };
    case 'all':
      return;
  }
};

export default async function EventList({ selection, order }: Props) {
  const sort = order === 'dsc' ? '-datetime' : 'datetime';

  const payload = await getPayload({ config: payloadConfig });

  const { docs: events } = await payload.find({
    collection: 'events',
    sort,
    where: getWehreQuery(selection),
    limit: 100,
    depth: 1,
  });

  return events.length === 0 ? (
    <p>No upcoming events</p>
  ) : (
    <ul className="space-y-4 md:w-3/4">
      {events.map((event) => (
        <li
          key={event.id}
          className="border p-1 md:p-4 gap-2 rounded bg-stone-800 flex flex-col md:flex-row justify-between"
        >
          <div>
            <h2 className="text-xl font-semibold">{event.name}</h2>
            <p>{format(new Date(event.datetime), 'MMMM do, yyyy')}</p>
            <p>Tickets Sold: {event.ticketsSold}</p>
            {(event.ticketsSold ?? 0) >= (event.ticketLimit ?? 0) && (
              <strong>SOLD OUT</strong>
            )}
          </div>
          <Button className="m-4" asChild>
            <Link href={`/${event.id}/list`}>View Attendees</Link>
          </Button>
        </li>
      ))}
    </ul>
  );
}
