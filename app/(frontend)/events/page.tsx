import { getUpcomingEvents } from '@/utils/getEvents';
import EventCard from '@/components/event-card/event-card';
import '../globals.css';
import { Rubik_Glitch } from 'next/font/google';
import { cn } from '@/utils/utils';

const rubikGlitchFont = Rubik_Glitch({
  weight: '400',
  subsets: ['latin'],
});

export const dynamic = 'force-dynamic';

export default async function EventsPage() {
  const events = await getUpcomingEvents();

  return (
    <main className="flex flex-col w-full m-0 p-2 pt-12 pb-8 md:px-12 md:pt-20 items-center justify-center">
      <h1
        className={cn(
          'text-5xl font-bold mb-8 text-center',
          rubikGlitchFont.className
        )}
      >
        Upcoming Events
      </h1>
      {events.length === 0 ? (
        <p className="text-center text-lg text-zinc-400">
          No upcoming events at this time.
        </p>
      ) : (
        <div className="flex flex-col w-4/5 gap-8 self-center items-center">
          {events.map((event) => (
            <EventCard
              key={event.id}
              {...event}
              orientation="horz"
              isSoldOut={
                !!event.ticketLimit &&
                !!event.ticketsSold &&
                event.ticketsSold >= event.ticketLimit
              }
            />
          ))}
        </div>
      )}
    </main>
  );
}
