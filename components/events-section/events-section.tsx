import ListedEventCard from '../listed-event-card/listed-event-card';
import type { ListedEvent } from '@/utils/eventsListing';
import { cn } from '@/utils/utils';
import { ArrowRight, Film } from 'lucide-react';
import Link from 'next/link';
import SectionHeading from '../ui/section-heading';

/** Cards shown in the section; the rest are a click away on /events. */
const MAX_CARDS = 3;

type Props = {
  /** Every upcoming event, Halloweek included (see buildEventListing). */
  events: ListedEvent[];
  /**
   * Always show the "More Events" link to /events. Without it, the link still
   * shows whenever there are more events than cards.
   */
  showMoreLink?: boolean;
};

export default function EventsSection({ events, showMoreLink = false }: Props) {
  const showMore = showMoreLink || events.length > MAX_CARDS;

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
          title="Upcoming Events"
          icon={Film}
          className="mb-20"
        />

        {events.length === 0 ? (
          <div className="text-center py-20">
            <div className="zvc-icon-frame w-20 h-20 mb-6">
              <Film className="w-10 h-10" />
            </div>
            <h3 className="font-display uppercase text-2xl md:text-3xl text-glow/60">
              No upcoming events at the moment
            </h3>
            <p className="mt-4 zvc-body text-retro-blue/70">
              Check back soon for our next event
            </p>
          </div>
        ) : (
          <>
            {/* Events grid */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-10 lg:gap-12 mb-16">
              {events.slice(0, MAX_CARDS).map((item, idx) => (
                <div
                  key={
                    item.kind === 'event'
                      ? `event-${item.event.id}`
                      : `halloweek-${item.slot.id}`
                  }
                  className={cn(
                    // Full width on phones; from sm+ each card is at least 450px
                    // (so long titles don't truncate), growing to fill and
                    // wrapping when a row can't fit another 450px card.
                    'flex flex-col gap-3',
                    'w-full sm-flex-1 sm:w-[360px] sm:grow max-w-[450px]',
                    'animate-in fade-in slide-in-from-bottom-8 duration-700'
                  )}
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  <ListedEventCard item={item} orientation="vert" />
                </div>
              ))}
            </div>

            {showMore && (
              <div className="text-center">
                <Link href="/events" className="zvc-btn-outline text-lg py-4">
                  More Events
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
