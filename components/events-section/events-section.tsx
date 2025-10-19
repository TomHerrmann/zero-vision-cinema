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
    description:
      'Kick off the week with Party Right Here Vol 13 at Culture Lab LIC, featuring a special horror scene installation from ZVC and AHC.',
    image:
      'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/partyrighthere.png',
  },
  {
    date: 'Sunday Oct 26',
    location: '31 Ave & 34th St',
    eventName: 'Scary Streets - Halloweentown',
    time: '5pm',
    description:
      "Our most family-friendly and nostalgic event. Join us on 31st Ave Open Street for a screening of the 90's TV classic Halloweentown. Bring your family, chairs, and your inner child.",
    image:
      'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/Spooky%20Streets%20%28Instagram%20Post%20%2845%29%29%20%281%29.png',
  },
  {
    date: 'Monday Oct 27',
    location: 'Heart of Gold',
    eventName: 'Astoria Horror Club - Halloween Resurrection',
    time: '7pm',
    description:
      "It wouldn't be Halloween without a Michael Myers movie at Heart of Gold. This year, we're diving into Halloween Resurrection, a flop so bad it nearly sent the series to straight-to-video hell.",
    image:
      'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/horror%20club.png',
  },
  {
    date: 'Tuesday Oct 28',
    location: 'Heart of Gold',
    eventName: 'Astoria Horror Book Club - The Mean Ones',
    time: '7pm',
    description:
      "The Astoria Horror Book Club is meeting at Fresco's Grand Cantina to dissect and discuss The Mean Ones.",
    image:
      'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/Halloweek%20Book%20Club%20%28Instagram%20Post%20%2845%29%29.png',
  },
  {
    date: 'Wednesday Oct 29',
    location: 'Single Cut',
    eventName: 'Spooky Sounds',
    time: '6pm',
    description:
      'Live music and horror movies join forces at Single Cut. Local bands will be playing over iconic and terrifying movie scenes.',
    image:
      'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/spookysounds.png',
  },
  {
    date: 'Thursday Oct 30',
    location: 'The Local',
    eventName: 'BrewScares Standup Comedy Show',
    time: '7:30pm',
    description:
      "We're teaming up with Brewskies NYC at The Local for a night of stand-up comedy and everyone's favorite nostalgia: '90s TV Halloween Specials!",
    image:
      'https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/brewscares.png',
  },
  {
    date: 'Friday Oct 31',
    location: 'Focal Point Beer Co.',
    eventName: 'Halloween Party',
    time: '8pm',
    description:
      "YOU CAN'T SKIP THIS ONE! Our Halloween party at Focal Point Beer is a blast. As always, we'll have a costume contest, spooky prizes, and our Halloween tradition: THE POWER HOUR!",
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
        // <div className="text-center">
        //   <h3 className={cn('text-[1rem] md:text-[2rem] font-semibold mb-12')}>
        //     We don't have any events coming up. Check back soon!
        //   </h3>
        // </div>
        <></>
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
      <div>
        <div className="text-center mb-8">
          <h3
            className={cn(
              'text-[2rem] md:text-[3rem] font-semibold',
              rubikGlitchFont.className
            )}
          >
            HALLOWEEK 2025
          </h3>
          <div className="max-w-4xl mx-auto mt-6 px-4">
            <p className="text-lg md:text-3xl leading-relaxed mb-4">
              Seven days. Seven free events. Halloweek 2025 is coming!
            </p>
            <p className="text-base md:text-2xl leading-relaxed">
              Zero Vision Cinema and Astoria Horror Club are taking over Astoria
              and LIC for an entire week of movies, music, and mischief.
            </p>
          </div>
        </div>
        <div className={cn('w-full max-w-7xl mx-auto px-4')}>
          <div
            className={cn(
              'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 [&>*:last-child:nth-child(3n+1)]:lg:col-start-2'
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
