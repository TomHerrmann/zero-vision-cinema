import Image from 'next/image';
import '../globals.css';
import { cn } from '@/utils/utils';
import { Creepster } from 'next/font/google';
import { AHC_LOGO_PNG_URL } from '@/app/contsants/constants';

const creepsterfont = Creepster({
  weight: '400',
  subsets: ['latin'],
});

export default async function AstoriaHorrorClubPage() {
  return (
    <main className="m-8 mb-0 md:mx-12 md:mt-20">
      <section className="flex w-full justify-center">
        <Image
          src={AHC_LOGO_PNG_URL}
          alt="astoria horror club logo"
          width={500}
          height={500}
        />
      </section>
      <section
        id="about"
        className="flex flex-col justify-center align-center rounded-none border-none p-2 md:p-12 w-full"
      >
        <div className="text-center">
          <h2
            className={cn(
              'text-[2.5rem] md:text-[4rem] font-semibold mb-4',
              creepsterfont.className
            )}
          >
            About Us
          </h2>
        </div>
        <div className="flex justify-center text-center">
          <p className="text-xl md:px-8 max-w-[45em]">
            Astoria Horror Club builds community through a shared love of scary
            movies and books. AHC was started in 2021 with a reddit post to
            r/astoria with the goal of finding other horror fans in the
            neighborhood. Since then we have hosted movie nights, block parties,
            book clubs, and other amazing events in the area. We welcome horror
            fans of all kinds to join us in celebrating the genre and making
            meaningful connections with others.
          </p>
        </div>
      </section>
    </main>
  );
}
