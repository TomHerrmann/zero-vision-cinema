import { getUpcomingEvents } from '@/utils/getEvents';
import EventCard from '@/components/event-card/event-card';
import '../globals.css';

export default async function EventsPage() {
  const events = await getUpcomingEvents();

  return (
    <main className="max-w-5xl md:m-12 m-0 mt-12 p-2 md:p-12 items-center">
      <h1 className="text-3xl font-bold mb-8 text-center">Upcoming Events</h1>
      {events.length === 0 ? (
        <p className="text-center text-lg text-zinc-400">
          No upcoming events at this time.
        </p>
      ) : (
        <div className="flex flex-col gap-8 justify-center align-center">
          {events.map((event) => (
            <EventCard key={event.id} {...event} orientation="horz" />
          ))}
        </div>
      )}
    </main>
  );
}
