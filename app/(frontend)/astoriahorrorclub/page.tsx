import Image from 'next/image';
import '../globals.css';
import { cn } from '@/utils/utils';
import { Creepster } from 'next/font/google';
import { AHC_LOGO_PNG_URL } from '@/app/contsants/constants';
import { BookOpen, Users, Calendar, Heart } from 'lucide-react';

const creepsterfont = Creepster({
  weight: '400',
  subsets: ['latin'],
});

export default async function AstoriaHorrorClubPage() {
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
        {/* Logo Section */}
        <section className="flex w-full justify-center mb-16 md:mb-20">
          <div className="relative animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <Image
              src={AHC_LOGO_PNG_URL}
              alt="astoria horror club logo"
              width={500}
              height={500}
              className="drop-shadow-2xl"
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
            <div className="inline-flex items-center gap-3 mb-6 px-6 py-2 border border-primary/20 bg-primary/5 backdrop-blur-sm">
              <Heart className="w-5 h-5 text-primary" />
              <span className="text-sm uppercase tracking-widest text-primary/80">
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

            <div className="w-32 h-1 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent" />
          </div>

          {/* Content */}
          <div className="flex justify-center text-center mb-16">
            <p className="text-lg md:text-xl lg:text-2xl text-foreground/80 max-w-[45em] leading-relaxed">
              Astoria Horror Club builds community through a shared love of scary
              movies and books. AHC was started in 2021 with a reddit post to
              r/astoria with the goal of finding other horror fans in the
              neighborhood. Since then we have hosted movie nights, block parties,
              book clubs, and other amazing events in the area. We welcome horror
              fans of all kinds to join us in celebrating the genre and making
              meaningful connections with others.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full max-w-5xl">
            <div className="group relative p-8 border-2 border-primary/20 bg-background/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Movie Nights</h3>
                <p className="text-foreground/70">
                  Regular screenings of classic and contemporary horror films
                </p>
              </div>
            </div>

            <div className="group relative p-8 border-2 border-primary/20 bg-background/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Book Clubs</h3>
                <p className="text-foreground/70">
                  Discuss spine-tingling horror literature with fellow fans
                </p>
              </div>
            </div>

            <div className="group relative p-8 border-2 border-primary/20 bg-background/50 backdrop-blur-sm hover:border-primary/40 transition-all duration-300 shadow-lg hover:shadow-xl">
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Community Events</h3>
                <p className="text-foreground/70">
                  Block parties and special events bringing horror fans together
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />
    </main>
  );
}
