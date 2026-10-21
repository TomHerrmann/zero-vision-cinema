import Link from 'next/link';
import { getUpcomingEvents } from '@/utils/getEvents';
import { isSoldOut } from '@/utils/isSoldOut';
import { EVENT_TYPE_NAMES } from '@/utils/eventTypes';
import { buildEventListing } from '@/utils/eventsListing';
import EventCard from '@/components/event-card/event-card';
import SlotCard from '../halloweek2026/components/slot-card';
import {
  HALLOWEEK,
  HALLOWEEK_SCHEDULE,
} from '../halloweek2026/halloweek.data';
import '../globals.css';
import { cn } from '@/utils/utils';
import { Film } from 'lucide-react';
import SectionHeading from '@/components/ui/section-heading';

// Revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

export default async function EventsPage() {
  const events = buildEventListing(
    await getUpcomingEvents(),
    HALLOWEEK_SCHEDULE
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-blackout">
      {/* Texture */}
      <div
        className="absolute inset-0 zvc-grain pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-32 pt-32 md:pt-40">
        <SectionHeading
          as="h1"
          kicker="All Screenings"
          title="Upcoming Events"
          icon={Film}
          className="mb-20"
        />

        {events.length === 0 ? (
          <div className="text-center py-20">
            <div className="zvc-icon-frame w-20 h-20 mb-6">
              <Film className="w-10 h-10" />
            </div>
            <h3 className="font-display uppercase text-3xl md:text-4xl text-glow/60">
              No upcoming events at this time
            </h3>
            <p className="mt-4 zvc-body text-retro-blue/70">
              Check back soon for our next screening
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 md:gap-10 max-w-5xl mx-auto">
            {events.map((item, idx) => (
              <div
                key={
                  item.kind === 'event'
                    ? `event-${item.event.id}`
                    : `halloweek-${item.slot.id}`
                }
                className={cn(
                  'flex flex-col gap-3',
                  'animate-in fade-in slide-in-from-bottom-8 duration-700'
                )}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Series label, so a book club night reads differently from a screening. */}
                {item.kind === 'event' ? (
                  <>
                    <span className="zvc-kicker block text-xs">
                      {EVENT_TYPE_NAMES[item.event.eventType]}
                    </span>
                    <EventCard
                      {...item.event}
                      orientation="horz"
                      isSoldOut={isSoldOut(item.event)}
                    />
                  </>
                ) : (
                  <>
                    <Link
                      href="/halloweek2026"
                      className="zvc-kicker block text-xs hover:text-glow transition-colors"
                    >
                      {HALLOWEEK.name} {HALLOWEEK.year}
                    </Link>
                    <SlotCard slot={item.slot} />
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
