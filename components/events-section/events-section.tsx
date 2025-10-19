import EventCard from '../event-card/event-card';
import StaticEventCard from '../static-event-card/static-event-card';
import { Event } from '@/payload-types';
import { cn } from '@/utils/utils';
import { Rubik_Glitch } from 'next/font/google';
import { Button } from '../ui/button';
import Link from 'next/link';

const rubikGlitchFont = Rubik_Glitch({
  weight: '400',
  subsets: ['latin'],
});

const staticEvents = [
  {
    date: 'Saturday Oct 25',
    location: 'Culture Lab LIC',
    eventName: 'Party Right Here - Vol. 13',
    time: '8pm - 3am',
    image:
      'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/partyrighthere.png',
  },
  {
    date: 'Sunday Oct 26',
    location: '31 Ave & 34th St',
    eventName: 'Scary Streets - Halloweentown',
    time: '5pm',
    image:
      'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/Spooky%20Streets%20%28Instagram%20Post%20%2845%29%29%20%281%29.png',
  },
  {
    date: 'Monday Oct 27',
    location: 'Heart of Gold',
    eventName: 'Astoria Horror Club - Halloween Resurrection',
    time: '7pm',
    image:
      'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/horror%20club.png',
  },
  {
    date: 'Tuesday Oct 28',
    location: 'Heart of Gold',
    eventName: 'Astoria Horror Book Club - The Mean Ones',
    time: '7pm',
    image:
      'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/book%20club.png',
  },
  {
    date: 'Wednesday Oct 29',
    location: 'Single Cut',
    eventName: 'Spooky Sounds',
    time: '6pm',
    image:
      'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/spookysounds.png',
  },
  {
    date: 'Thursday Oct 30',
    location: 'The Local',
    eventName: 'BrewScares Standup Comedy Show',
    time: '7:30pm',
    image:
      'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/brewscares.png',
  },
  {
    date: 'Friday Oct 31',
    location: 'Focal Point Beer Co.',
    eventName: 'Halloween Party',
    time: '8pm',
    image:
      'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/halloweenparty2025_social.png',
  },
];

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
        <div className="text-center">
          <h3 className={cn('text-[1rem] md:text-[2rem] font-semibold mb-12')}>
            We don't have any events coming up. Check back soon!
          </h3>
        </div>
      ) : (
        <>
          <div className={cn('w-full max-w-5xl mx-auto')}>
            <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-8')}>
              {events.slice(0, 3).map((event, idx) => (
                <div key={idx} className="p-4">
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
                className="w-full md:w-1/4 px-8 py-6 bg-sky-900 text-yellow-50 rounded-lg shadow hover:bg-yellow-50 transition duration-200"
              >
                <Link target="_blank" href="/events" className="text-2xl">
                  See More Events
                </Link>
              </Button>
            </div>
          )}
        </>
      )}

      {/* Static Halloween Week Events */}
      <div className="mt-16">
        <div className="text-center mb-8">
          <h3
            className={cn(
              'text-[2rem] md:text-[3rem] font-semibold',
              rubikGlitchFont.className
            )}
          >
            Halloween Week Events
          </h3>
        </div>
        <div className={cn('w-full max-w-7xl mx-auto px-4')}>
          <div
            className={cn(
              'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            )}
          >
            {staticEvents.map((event, idx) => (
              <StaticEventCard key={idx} event={event} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
