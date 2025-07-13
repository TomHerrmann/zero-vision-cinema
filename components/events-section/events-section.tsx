'use client';

import EventCard from '../event-card/event-card';
import { Event } from '@/payload-types';
import { cn } from '@/utils/utils';
import { Rubik_Glitch } from 'next/font/google';
import { useState, useMemo } from 'react';

const rubikGlitchFont = Rubik_Glitch({
  weight: '400',
  subsets: ['latin'],
});

type Props = { events: Event[] };

export default function EventsSection({ events }: Props) {
  const [expanded, setExpanded] = useState(false);

  const initialShowCount = 3;
  const expandedShowCount = 9;

  const displayedEvents = useMemo(() => {
    if (expanded) {
      return events.slice(0, expandedShowCount);
    }
    return events.slice(0, initialShowCount);
  }, [events, expanded, initialShowCount, expandedShowCount]);

  const showMoreButton = !expanded && events.length > initialShowCount;

  const showLessButton = expanded && events.length > initialShowCount;

  const shouldScroll = expanded && events.length > expandedShowCount;

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
          <div
            className={cn('w-full max-w-5xl mx-auto', {
              'overflow-y-auto md:max-h-[900px]': shouldScroll,
            })}
          >
            <div className={cn('grid grid-cols-1 md:grid-cols-3 gap-8')}>
              {displayedEvents.map((event, idx) => (
                <div key={idx} className="p-4">
                  <EventCard {...event} />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center mt-8">
            {showMoreButton && (
              <button
                className="px-6 py-2 bg-sky-900 text-yellow-50 rounded-lg shadow hover:bg-sky-600 transition duration-200"
                onClick={() => setExpanded(true)}
              >
                Show More Events
              </button>
            )}
            {showLessButton && (
              <button
                className="px-6 py-2 bg-sky-900 text-yellow-50 rounded-lg shadow hover:bg-sky-600 transition duration-200"
                onClick={() => setExpanded(false)}
              >
                Show Less Events
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
