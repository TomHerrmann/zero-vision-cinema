import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Rubik_Glitch } from 'next/font/google';

const rubikGlitchFont = Rubik_Glitch({
  weight: '400',
  subsets: ['latin'],
});

export default function Hero() {
  return (
    <section className="relative top-0 w-full md:h-[500px] sm:h-[300px] h-[275px] overflow-hidden z-10">
      <Image
        src="/projector_blue.png"
        alt="Hero Image"
        fill
        className="object-cover -z-10"
      />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-white w-full px-5">
        <h1
          className={cn(
            'text-[3rem] mb-2.5 md:text-[6rem] pt-8',
            rubikGlitchFont.className
          )}
        >
          ZERO VISION CINEMA
        </h1>
        <p className="text-[1.5rem] md:text-[3rem]">Pop-up Screenings in NYC</p>
      </div>
    </section>
  );
}
