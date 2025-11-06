import { cn } from '@/utils/utils';
import { Rubik_Glitch } from 'next/font/google';

const rubikGlitchFont = Rubik_Glitch({
  weight: '400',
  subsets: ['latin'],
});

export default function About() {
  return (
    <section
      id="about"
      className="flex flex-col justify-center align-center rounded-none border-none bg-foreground text-stone-900 p-12 w-full"
    >
      <div className="text-center">
        <h2
          className={cn(
            'text-[2.5rem] md:text-[4rem] font-semibold mb-4',
            rubikGlitchFont.className
          )}
        >
          About Us
        </h2>
      </div>
      <div className="flex justify-center text-center">
        <p className="md:w-1/2 text-xl md:px-8">
          Zero Vision Cinema screens films at venues throughout NYC, from bars
          and breweries to block parties. We curate a selection of niche movies,
          genre films, and old favorites. See our upcoming events to find out
          what's playing. Contact us to request a quote for a screening at your
          business or event.
        </p>
      </div>
    </section>
  );
}
