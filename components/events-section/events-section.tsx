import EventCard from '../event-card/event-card';
import { Event } from '@/payload-types';
import { cn } from '@/utils/utils';
import Link from 'next/link';
import { Film } from 'lucide-react';
import SectionHeading from '../ui/section-heading';
import { isSoldOut } from '@/utils/isSoldOut';

type Props = { events: Event[] };

export default function EventsSection({ events }: Props) {
  return (
    <section
      id="events"
      className="relative py-24 md:py-32 overflow-hidden bg-blackout"
    >
      {/* Texture */}
      <div
        className="absolute inset-0 zvc-grain pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12">
        <SectionHeading
          kicker="What's Playing"
          title="Upcoming Screenings"
          icon={Film}
          className="mb-20"
        />

        {events.length === 0 ? (
          <div className="text-center py-20">
            <div className="zvc-icon-frame w-20 h-20 mb-6">
              <Film className="w-10 h-10" />
            </div>
            <h3 className="font-display uppercase text-2xl md:text-3xl text-glow/60">
              No upcoming screenings at the moment
            </h3>
            <p className="mt-4 zvc-body text-retro-blue/70">
              Check back soon for our next event
            </p>
          </div>
        ) : (
          <>
            {/* Events grid */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-10 lg:gap-12 mb-16">
              {events.slice(0, 3).map((event, idx) => (
                <div
                  key={event.id}
                  className={cn(
                    // Full width on phones; from sm+ each card is at least 450px
                    // (so long titles don't truncate), growing to fill and
                    // wrapping when a row can't fit another 450px card.
                    'w-full sm-flex-1 sm:w-[360px] sm:grow max-w-[450px]',
                    'animate-in fade-in slide-in-from-bottom-8 duration-700'
                  )}
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  <EventCard {...event} isSoldOut={isSoldOut(event)} />
                </div>
              ))}
            </div>

            {/* See more button */}
            {events.length > 3 && (
              <div className="flex justify-center">
                <Link href="/events" className="zvc-btn text-lg py-4 group">
                  <span>See All Screenings</span>
                  <svg
                    className="w-5 h-5 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
