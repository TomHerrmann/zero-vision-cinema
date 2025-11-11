import EventCard from '../event-card/event-card';
import { Event } from '@/payload-types';
import { cn } from '@/utils/utils';
import { Button } from '../ui/button';
import Link from 'next/link';
import { Film, Calendar } from 'lucide-react';

type Props = { events: Event[] };

export default function EventsSection({ events }: Props) {
  return (
    <section id="events" className="relative py-24 md:py-32 overflow-hidden">
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

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 md:px-12">
        {/* Section header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 mb-6 px-6 py-2 border border-primary/20 bg-primary/5 backdrop-blur-sm">
            <Film className="w-5 h-5 text-primary" />
            <span className="text-sm uppercase tracking-widest text-primary/80">
              What&apos;s Playing
            </span>
            <Calendar className="w-5 h-5 text-primary" />
          </div>

          <h2
            className={cn(
              'font-rubik-glitch text-[2.5rem] md:text-[5rem] lg:text-[6rem]',
              'leading-none mb-6',
              'bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent'
            )}
          >
            Upcoming Screenings
          </h2>

          <div className="w-32 h-1 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-full bg-primary/10 border border-primary/20">
              <Film className="w-10 h-10 text-primary/40" />
            </div>
            <h3 className="text-2xl md:text-3xl font-light text-foreground/60">
              No upcoming screenings at the moment
            </h3>
            <p className="mt-4 text-foreground/40">
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
                    'group relative w-full md:w-[calc(50%-1.25rem)] lg:w-[calc(33.333%-2rem)] max-w-md',
                    'animate-in fade-in slide-in-from-bottom-8 duration-700'
                  )}
                  style={{ animationDelay: `${idx * 150}ms` }}
                >
                  {/* Decorative corner accents */}
                  <div className="absolute -top-2 -left-2 w-8 h-8 border-l-2 border-t-2 border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 border-r-2 border-b-2 border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

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

            {/* See more button */}
            {events.length > 3 && (
              <div className="flex justify-center">
                <Button
                  asChild
                  size="lg"
                  className={cn(
                    'group relative px-12 py-7 text-lg',
                    'bg-gradient-to-r from-primary via-primary to-primary/90',
                    'text-primary-foreground font-medium',
                    'hover:shadow-[0_0_40px_rgba(255,255,255,0.15)]',
                    'transition-all duration-300',
                    'border border-primary/20',
                    'overflow-hidden'
                  )}
                >
                  <Link href="/events" className="flex items-center gap-3">
                    <span className="relative z-10">See All Screenings</span>
                    <svg
                      className="relative z-10 w-5 h-5 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  </Link>
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />
    </section>
  );
}
