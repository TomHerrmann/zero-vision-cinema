import { getUpcomingEvents, isSoldOut } from '@/utils/getEvents';
import EventCard from '@/components/event-card/event-card';
import '../globals.css';
import { cn } from '@/utils/utils';
import { Film } from 'lucide-react';
import SectionHeading from '@/components/ui/section-heading';

// Revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

export default async function EventsPage() {
  const events = await getUpcomingEvents();

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
            {events.map((event, idx) => (
              <div
                key={event.id}
                className={cn(
                  'animate-in fade-in slide-in-from-bottom-8 duration-700'
                )}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <EventCard
                  {...event}
                  orientation="horz"
                  isSoldOut={isSoldOut(event)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
