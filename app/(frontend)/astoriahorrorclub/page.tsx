import Image from 'next/image';
import '../globals.css';
import { cn } from '@/utils/utils';
import { Creepster } from 'next/font/google';
import { AHC_LOGO_PNG_URL } from '@/app/contsants/constants';
import { BookOpen, Users, Calendar, Heart } from 'lucide-react';
import {
  getUpcomingAhcEvents,
  getUpcomingBookClubEvents,
} from '@/utils/getEvents';
import EventCard from '@/components/event-card/event-card';
import { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

const creepsterfont = Creepster({
  weight: '400',
  subsets: ['latin'],
});

export const revalidate = 300;

export default async function AstoriaHorrorClubPage() {
  const events = await getUpcomingAhcEvents();
  const bookClubEvents = await getUpcomingBookClubEvents();

  return (
    <main className="ahc-legacy relative min-h-screen overflow-hidden font-sans">
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
        {/* Logo Section */}
        <section className="flex w-full justify-center mb-16 md:mb-20">
          <div className="relative group animate-in fade-in slide-in-from-bottom-8 duration-1000">
            {/* Subtle glow effect */}
            <div className="absolute inset-0 bg-blue-light/10 blur-[80px] scale-90 group-hover:scale-100 transition-transform duration-700" />

            <Image
              src={AHC_LOGO_PNG_URL}
              alt="astoria horror club logo"
              width={500}
              height={500}
              className="relative drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </section>

        {/* About Section */}
        <section
          id="about"
          className="flex flex-col justify-center items-center w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200"
        >
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6 px-6 py-2 border border-blue-light/20 bg-blue-light/5 backdrop-blur-sm">
              <Heart className="w-5 h-5 text-blue-light" />
              <span className="text-sm uppercase tracking-widest text-blue-light/80">
                Community & Horror
              </span>
            </div>

            <h2
              className={cn(
                'text-[2.5rem] md:text-[5rem] lg:text-[6rem]',
                'leading-none mb-6',
                'bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent',
                creepsterfont.className
              )}
            >
              About Us
            </h2>

            <div className="w-32 h-1 mx-auto bg-gradient-to-r from-transparent via-blue-light to-transparent" />
          </div>

          {/* Content */}
          <div className="flex justify-center text-center mb-16">
            <p className="text-lg md:text-xl lg:text-2xl text-foreground/80 max-w-[45em] leading-relaxed">
              Astoria Horror Club builds community through a shared love of
              scary movies and books. AHC was started in 2021 with a reddit post
              to r/astoria with the goal of finding other horror fans in the
              neighborhood. Since then we have hosted movie nights, block
              parties, book clubs, and other amazing events in the area. We
              welcome horror fans of all kinds to join us in celebrating the
              genre and making meaningful connections with others.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-5xl">
            <div className="group relative p-8 border-2 border-blue-light/20 bg-background/50 backdrop-blur-sm hover:border-blue-light/40 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-light/10 border border-blue-light/20 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-blue-light" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Movie Nights
                </h3>
                <p className="text-foreground/70">
                  Regular screenings of classic and contemporary horror films
                </p>
              </div>
            </div>

            <div className="group relative p-8 border-2 border-blue-light/20 bg-background/50 backdrop-blur-sm hover:border-blue-light/40 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-light/10 border border-blue-light/20 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-blue-light" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Book Clubs
                </h3>
                <p className="text-foreground/70">
                  Discuss spine-tingling horror literature with fellow fans
                </p>
              </div>
            </div>

            <div className="group relative p-8 border-2 border-blue-light/20 bg-background/50 backdrop-blur-sm hover:border-blue-light/40 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-light/10 border border-blue-light/20 flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-light" />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Community Events
                </h3>
                <p className="text-foreground/70">
                  Special events bringing horror fans together
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Upcoming Events */}
        {events.length > 0 && (
          <section
            id="events"
            className="mt-24 md:mt-32 animate-in fade-in slide-in-from-bottom-8 duration-1000"
          >
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 mb-6 px-6 py-2 border border-blue-light/20 bg-blue-light/5 backdrop-blur-sm">
                <Calendar className="w-5 h-5 text-blue-light" />
                <span className="text-sm uppercase tracking-widest text-blue-light/80">
                  Join Us
                </span>
              </div>
              <h2
                className={cn(
                  'text-[2.5rem] md:text-[5rem] lg:text-[6rem]',
                  'leading-none mb-6',
                  'bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent',
                  creepsterfont.className
                )}
              >
                Upcoming Events
              </h2>
              <div className="w-32 h-1 mx-auto bg-gradient-to-r from-transparent via-blue-light to-transparent" />
            </div>

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
                  <EventCard {...event} isSoldOut={false} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Book Club */}
        {bookClubEvents.length > 0 && (
          <section
            id="book-club"
            className="mt-24 md:mt-32 animate-in fade-in slide-in-from-bottom-8 duration-1000"
          >
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 mb-6 px-6 py-2 border border-blue-light/20 bg-blue-light/5 backdrop-blur-sm">
                <BookOpen className="w-5 h-5 text-blue-light" />
                <span className="text-sm uppercase tracking-widest text-blue-light/80">
                  Read With Us
                </span>
              </div>
              <h2
                className={cn(
                  'text-[2.5rem] md:text-[5rem] lg:text-[6rem]',
                  'leading-none mb-6',
                  'bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent',
                  creepsterfont.className
                )}
              >
                Book Club
              </h2>
              <div className="w-32 h-1 mx-auto bg-gradient-to-r from-transparent via-blue-light to-transparent" />
            </div>

            <div className="flex flex-col gap-8 md:gap-10 max-w-5xl mx-auto">
              {bookClubEvents.map((event) => (
                <EventCard key={event.id} {...event} orientation="horz" />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />
    </main>
  );
}
