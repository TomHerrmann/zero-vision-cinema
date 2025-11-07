import EventCard from '../event-card/event-card';
import { Event } from '@/payload-types';
import { cn } from '@/utils/utils';
import { Rubik_Glitch } from 'next/font/google';
import { Button } from '../ui/button';
import Link from 'next/link';

const rubikGlitchFont = Rubik_Glitch({
  weight: '400',
  subsets: ['latin'],
});

type Props = { events: Event[] };

export default function EventsSection({ events }: Props) {
  return (
    <section id="events" className="flex flex-col py-12">
      <div className="text-center">
        <h2
          className={cn(
            'text-[2.5rem] md:text-[4rem] font-semibold mb-12',
            rubikGlitchFont.className
          )}
        >
          Upcoming Screenings
        </h2>
      </div>

      {events.length === 0 ? (
        // <div className="text-center">
        //   <h3 className={cn('text-[1rem] md:text-[2rem] font-semibold mb-12')}>
        //     We don't have any events coming up. Check back soon!
        //   </h3>
        // </div>
        <></>
      ) : (
        <>
          <div className={cn('w-full max-w-7xl mx-auto px-4')}>
            <div className={cn('flex flex-wrap justify-center gap-8')}>
              {events.slice(0, 3).map((event, idx) => (
                <div key={idx} className="w-full md:w-80 lg:w-96">
                  <EventCard
                    {...event}
                    isSoldOut={
                      !!event.ticketLimit &&
                      !!event.ticketsSold &&
                      event.ticketsSold >= event.ticketLimit
                    }
                  />
                </div>
              ))}
            </div>
          </div>
          {events.length > 3 && (
            <div className="flex justify-center mt-8 mx-[5rem]">
              <Button
                asChild
                className="w-full md:w-1/4 px-8 py-6 bg-accent-color text-foreground rounded-lg shadow hover:bg-foreground transition duration-200"
              >
                <Link target="_blank" href="/events" className="text-2xl">
                  See More Events
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
