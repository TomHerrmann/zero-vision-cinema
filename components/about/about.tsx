import { cn } from '@/utils/utils';
import { Sparkles, MapPin, Heart } from 'lucide-react';

export default function About() {
  return (
    <section
      id="about"
      className="relative py-32 md:py-40 overflow-hidden bg-gradient-to-b from-background via-foreground/5 to-background"
    >
      {/* Stylized film strip divider at top */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-foreground/5 to-transparent">
        <div className="absolute inset-0 flex items-center justify-between opacity-30">
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={`top-perf-${i}`}
              className="flex-shrink-0 w-2 h-6 bg-primary/40 rounded-full"
              style={{
                transform: `rotate(${Math.random() * 4 - 2}deg)`
              }}
            />
          ))}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      {/* Stylized film strip divider at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-foreground/5 to-transparent">
        <div className="absolute inset-0 flex items-center justify-between opacity-30">
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={`bottom-perf-${i}`}
              className="flex-shrink-0 w-2 h-6 bg-primary/40 rounded-full"
              style={{
                transform: `rotate(${Math.random() * 4 - 2}deg)`
              }}
            />
          ))}
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      </div>

      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary rounded-full blur-[120px] animate-pulse" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-accent-color rounded-full blur-[140px] animate-pulse"
          style={{ animationDelay: '2s' }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6 px-6 py-2 border border-primary/20 bg-background/80 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm uppercase tracking-widest text-foreground/70">
              Our Story
            </span>
          </div>

          <h2
            className={cn(
              'font-rubik-glitch text-[2.5rem] md:text-[5rem] lg:text-[6rem]',
              'leading-none mb-6',
              'bg-gradient-to-b from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent'
            )}
          >
            About Us
          </h2>
          <div className="w-32 h-1 mx-auto bg-gradient-to-r from-transparent via-primary to-transparent" />
        </div>

        <div className="space-y-12">
          <div>
            <p className="text-2xl md:text-3xl lg:text-4xl font-light text-center leading-relaxed text-foreground/90 max-w-4xl mx-auto">
              Zero Vision Cinema screens films at venues throughout NYC, from
              bars and breweries to block parties. We curate a selection of{' '}
              <span className="text-primary font-normal">niche movies</span>,{' '}
              <span className="text-primary font-normal">genre films</span>, and{' '}
              <span className="text-primary font-normal">cult classics</span>.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-20">
            <div className="group relative p-8 border border-primary/10 bg-background/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-full bg-primary/10 border border-primary/20">
                  <MapPin className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  Pop-Up Venues
                </h3>
                <p className="text-foreground/60 leading-relaxed">
                  Bringing cinema to unique locations across New York City, from
                  intimate bars to vibrant block parties.
                </p>
              </div>
            </div>

            <div className="group relative p-8 border border-primary/10 bg-background/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  Curated Selection
                </h3>
                <p className="text-foreground/60 leading-relaxed">
                  Underground favorites, hidden gems, and genre-defining films
                  you won't find in mainstream theaters.
                </p>
              </div>
            </div>

            <div className="group relative p-8 border border-primary/10 bg-background/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-14 h-14 mb-6 rounded-full bg-primary/10 border border-primary/20">
                  <Heart className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  Community Focused
                </h3>
                <p className="text-foreground/60 leading-relaxed">
                  We foster a welcoming community of film enthusiasts, creators,
                  and anyone who loves a good movie.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pt-12">
            <p className="text-lg md:text-xl text-foreground/70 mb-6">
              Interested in hosting a screening at your venue or event?
            </p>
            <a
              href="#contact"
              className={cn(
                'inline-block px-10 py-4 text-lg font-medium',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]',
                'transition-all duration-300',
                'border border-primary/20'
              )}
            >
              Get in Touch
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
