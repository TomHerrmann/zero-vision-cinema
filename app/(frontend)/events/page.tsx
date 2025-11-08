import { getUpcomingEvents } from '@/utils/getEvents';
import EventCard from '@/components/event-card/event-card';
import '../globals.css';
import { cn } from '@/utils/utils';
import { Film, Calendar } from 'lucide-react';

// Revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

export default async function EventsPage() {
  const events = await getUpcomingEvents();

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at center, oklch(0.987 0.026 102.212) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12 py-24 md:py-32">
        {/* Section header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-2 border border-primary/20 bg-primary/5 backdrop-blur-sm">
            <Film className="w-5 h-5 text-primary" />
            <span className="text-sm uppercase tracking-widest text-primary/80">
              All Screenings
            </span>
            <Calendar className="w-5 h-5 text-primary" />
          </div>

          <h1
            className={cn(
              'font-rubik-glitch text-[2.5rem] md:text-[5rem] lg:text-[6rem]',
              'leading-none mb-6',
              'bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent'
            )}
          >
            Upcoming Events
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl text-foreground/70 font-light mb-6">
            All our screenings in one place
          </p>

          <div className="w-32 h-1 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-primary/10 border border-primary/20">
              <Film className="w-10 h-10 text-primary/40" />
            </div>
            <h3 className="text-2xl md:text-3xl font-light text-foreground/60">
              No upcoming events at this time
            </h3>
            <p className="mt-4 text-foreground/40">Check back soon for our next screening</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 md:gap-10 max-w-5xl mx-auto">
            {events.map((event, idx) => (
              <div
                key={event.id}
                className={cn(
                  'group relative',
                  'animate-in fade-in slide-in-from-bottom-8 duration-700'
                )}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                {/* Decorative corner accents */}
                <div className="absolute -top-2 -left-2 w-8 h-8 border-l-2 border-t-2 border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 border-r-2 border-b-2 border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <EventCard
                  {...event}
                  orientation="horz"
                  isSoldOut={
                    !!event.ticketLimit &&
                    !!event.ticketsSold &&
                    event.ticketsSold >= event.ticketLimit
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />
    </main>
  );
}
