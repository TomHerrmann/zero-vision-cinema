import Link from 'next/link';
import EventCard from '../event-card/event-card';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';
import { Rubik_Glitch } from 'next/font/google';

const rubikGlitchFont = Rubik_Glitch({
  weight: '400',
  subsets: ['latin'],
});

type Props = { events: FakeEvent[] };

export default function EventsSection({ events }: Props) {
  return (
    <section id="events" className="flex flex-col">
      <div className="text-center">
        <h2
          className={cn(
            'text-[2.5rem] md:text-[4rem] text-black font-semibold mb-12',
            rubikGlitchFont.className
          )}
        >
          Upcoming Screenings
        </h2>
      </div>
      <div className="flex flex-wrap justify-evenly gap-4 md:gap-6 lg:gap-8 mb-12">
        {events
          ?.slice(0, 3)
          .map(
            (
              {
                title,
                description,
                datetime,
                location,
                price,
                ticketLink,
                imageUrl,
              },
              i
            ) => (
              <EventCard
                key={datetime + title + i}
                event={{
                  title,
                  description,
                  datetime,
                  location,
                  price,
                  ticketLink,
                  imageUrl,
                }}
              />
            )
          )}
      </div>
      {events.length > 3 && (
        <Button
          variant="outline"
          asChild
          className="md:w-fit w-[90%] md:self-end self-center md:mr-12"
        >
          <Link href="/events">View More Screenings</Link>
        </Button>
      )}
    </section>
  );
}
