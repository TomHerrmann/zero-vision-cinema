import { Metadata } from 'next';
import ContactForm from '@/components/contact-form/contact-form';
import { ZVC_PRESS_EMAIL_ADDRESS } from '@/app/contsants/constants';

export const metadata: Metadata = {
  title: 'Press — Zero Vision Cinema',
  description:
    'A pop-up movie theater, screening niche movies, genre films, and cult favorites around NYC.',
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="font-display uppercase text-glow text-2xl md:text-3xl mb-4">
        {title}
      </h2>
      <div className="zvc-body text-lg md:text-xl text-glow/80 leading-relaxed space-y-4">
        {children}
      </div>
    </section>
  );
}

const PRESS_AUDIENCES = [
  'Filmmakers',
  'PR agencies',
  'Distributors',
];

export default function PressPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-blackout">
      <div
        className="absolute inset-0 zvc-grain pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative z-10 max-w-3xl mx-auto px-6 md:px-12 py-28 md:py-36">
        <span className="zvc-kicker block mb-3">Press</span>
        <h1 className="zvc-heading text-4xl md:text-6xl mb-12">Press</h1>

        <Section title="About Zero Vision Cinema">
          <p>
            Zero Vision Cinema is built on a love of genre film and bringing
            people together. We screen films at venues throughout NYC, from
            bars and breweries to block parties. We build community online
            through our movie reviews, editorials, and social content.
          </p>
        </Section>

        <Section title="Who We Are">
          <p>
            We are Tom and Mary, movie lovers and critics. We bring people together through a shared love of genre films with
            events like Astoria Horror Club, Astoria Horror Book Club, Rewind
            Wednesday, and other film screenings.
          </p>
        </Section>

        <Section title="How It Started">
          <p>
            It started with Astoria Horror Club. AHC was started in 2021 with a
            reddit post to r/astoria with the goal of finding other horror fans
            in the area. Now it&apos;s a neighborhood staple with a
            vibrant community.
          </p>
          <p>
            Over the years we&apos;ve expanded to bring you Zero Vision Cinema,
            which lets us curate more genre films and host more screenings. We
            believe movies are better watched together.
          </p>
        </Section>

        <section className="zvc-card p-8 md:p-10">
          <h2 className="font-display uppercase text-glow text-2xl md:text-3xl mb-4">
            Press Contact
          </h2>
          <ul className="zvc-body text-lg text-glow/80 leading-relaxed mb-6 space-y-2 list-disc pl-6">
            {PRESS_AUDIENCES.map((audience) => (
              <li key={audience}>{audience}</li>
            ))}
          </ul>
          <p className="zvc-body text-glow/70">
            <a
              href={`mailto:${ZVC_PRESS_EMAIL_ADDRESS}`}
              className="text-blue-light underline"
            >
              {ZVC_PRESS_EMAIL_ADDRESS}
            </a>
          </p>
        </section>

        <div className="mt-12">
          <ContactForm inbox="press" />
        </div>
      </div>
    </main>
  );
}
