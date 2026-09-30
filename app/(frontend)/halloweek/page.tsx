import { Metadata } from 'next';
import { Clock, Ghost, MapPin, Ticket } from 'lucide-react';
import SectionHeading from '@/components/ui/section-heading';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Halloweek 2026 — Zero Vision Cinema',
  description:
    'Zero Vision Cinema Presents: Astoria Horror Club Halloweek 2026. Free Halloween events across Astoria and LIC, October 24–31.',
};

type HalloweekEvent = {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
};

const EVENTS: HalloweekEvent[] = [
  {
    title: 'Scary Streets',
    date: 'Sat 10/24',
    time: '7pm',
    location: 'Ditmars Open Streets',
    description:
      'If you’ve been to our movies on 31st Ave Open Street in years past, you know how much fun it was seeing Poltergeist, The Final Girls, and Halloweentown. This year we are showing Stephen King’s It. Starring the late, great Tim Curry, this made for tv movie will fill you with childhood nostalgia and dread.',
  },
  {
    title: 'Horror Brunch: Video Tape Terror',
    date: 'Sun 10/25',
    time: '1pm',
    location: 'Shillleigh Tavern',
    description:
      'One of our most beloved local events is back. Horror Brunch at Shillleigh Tavern is a longstanding series that pairs the weirdest horror movies we can find, and the best takeout brunch you can order. Come and vote on what we watch throughout the day. This time, every movie in this marathon will be screened on glorious, low-fi VHS.',
  },
  {
    title: 'Astoria Horror Club',
    date: 'Mon 10/26',
    time: '7pm',
    location: 'The Ditty',
    description:
      'This is the one that started it all. Come out to The Ditty for a special screening of Halloween II (also on VHS). Since we started Club back in 2021, we’ve shown a Michael Myers movie every year in October. This time we are going back to a true fan favorite.',
  },
  {
    title: 'Astoria Horror Book Club',
    date: 'Tues 10/27',
    time: '7pm',
    location: 'Medusa Art Studio',
    description:
      'There’s more than just movies for the Halloween season. Get your copy of the Ghosts of Gwendolyn Montgomery by Clarence A. Haynes and come out to Medusa Art Studio for a lively discussion. This is a cozy ghostly tale about the barrier between the living and the dead coming thin. The perfect read to pair with your pumpkin spice latte.',
  },
  {
    title: 'Spooky Sounds',
    date: 'Wed 10/28',
    time: '6:30pm',
    location: 'SingleCut',
    description:
      'A true ZVC celebration, we are bringing you an evening of live music with some phenomenal local bands. X, Y, Z will all be there playing X, Y, Z genre. Join us at SingleCut as the bands take the stage to videos of classic horror. It’s a night of rock right here in Astoria.',
  },
  {
    title: 'Brewscares',
    date: 'Thurs 10/29',
    time: '6:30pm',
    location: 'QED',
    description:
      'This one brings you comics and good old 90’s horror tv. Join us at QED where we will be watching spooky episodes of kids television, while a comedian prepares to ruff off what we just watched. It’s an evening of thrills and laughs that your inner child would die for.',
  },
  {
    title: 'Scaryoke',
    date: 'Fri 10/30',
    time: '10pm',
    location: 'Sissy McGinty’s',
    description:
      'A new edition to this year’s Halloweek, we are partnering with Sissy McGinty’s for Karaoke Halloween style. Come dressed up and join your hosts as we belt out our favorite tunes. Except some classics with some halloween tunes thrown in the mix. It’s the perfect event to start Halloweekend!',
  },
  {
    title: '5th Annual Halloween Party',
    date: 'Sat 10/31',
    time: '8pm',
    location: 'Focal Point Beer Co.',
    description:
      'Our biggest event of the year is our annual Halloween party! We kick the night off with our annual costume content. Top prize includes picking a film for a future Astoria Horror Club and 2 tickets to A Ghost in Your Ear. The main event of the night is a scary movie inspired power hour. The Power Hour is 1 hour full of 60 second clips designed to delight, horrify, and scare even the most dedicated horror fans.',
  },
];

const ALL_WEEK = {
  location: 'Museum of the Moving Image',
  dates: '10/25 – 10/31',
  offer: '20% Discount to admission or screenings',
  code: 'ZeroVision20',
};

function EventRow({
  event,
  index,
}: {
  event: HalloweekEvent;
  index: number;
}) {
  return (
    <li
      className="animate-in fade-in slide-in-from-bottom-8 duration-700 motion-reduce:animate-none"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <article className="zvc-card grid md:grid-cols-[12rem_1fr]">
        <div className="flex md:flex-col items-center md:items-start justify-between md:justify-start gap-2 p-6 border-b-2 md:border-b-0 md:border-r-2 border-glow/15 bg-blackout/40">
          <span className="zvc-kicker text-sm">Night {index + 1}</span>
          <span className="font-display uppercase text-glow text-3xl md:text-4xl leading-none">
            {event.date}
          </span>
        </div>

        <div className="p-6 md:p-8">
          <h2 className="zvc-heading text-3xl md:text-5xl mb-4">
            {event.title}
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-5 text-glow/90">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-light" aria-hidden="true" />
              {event.time}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-light" aria-hidden="true" />
              {event.location}
            </span>
          </div>
          <p className="zvc-body text-base md:text-lg leading-relaxed">
            {event.description}
          </p>
        </div>
      </article>
    </li>
  );
}

export default function HalloweekPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-blackout">
      <div
        className="absolute inset-0 zvc-grain pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 zvc-scratches pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 md:px-12 py-24 md:py-32 pt-32 md:pt-40">
        <SectionHeading
          as="h1"
          kicker="Zero Vision Cinema Presents"
          title={
            <>
              Astoria Horror Club
              <br />
              Halloweek 2026
            </>
          }
          icon={Ghost}
          className="mb-16"
        />

        <section className="text-center mb-16 md:mb-20">
          <h2 className="zvc-heading zvc-stamp text-3xl md:text-5xl mb-8">
            Halloweek returns to Astoria and LIC!!!
          </h2>
          <div className="zvc-body text-lg md:text-xl leading-relaxed space-y-5 max-w-3xl mx-auto">
            <p>
              Get spooky with your neighbors the entire week leading up to
              Halloween at all of our FREE EVENTS. We have something going on
              for anyone who loves All Hallows Eve from Saturday October 25th
              all the way through to the big day, Saturday October 31st.
            </p>
            <p>
              This is the second year Zero Vision Cinema is putting together a
              Halloweek series, and we were so excited with how last years went
              we have even more going on. Check out the list of events below.
            </p>
          </div>
        </section>

        <aside className="zvc-panel border-2 border-blue-light/40 p-6 md:p-8 mb-12 md:mb-16">
          <div
            className="absolute inset-0 zvc-halftone pointer-events-none"
            aria-hidden="true"
          />
          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            <div className="zvc-icon-frame w-14 h-14 shrink-0">
              <Ticket className="w-7 h-7" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <span className="zvc-kicker text-sm block mb-2">
                All Week · {ALL_WEEK.dates}
              </span>
              <h2 className="font-display uppercase text-glow text-2xl md:text-3xl leading-tight">
                {ALL_WEEK.location}
              </h2>
              <p className="zvc-body mt-1">{ALL_WEEK.offer}</p>
            </div>
            <span className="zvc-badge self-start md:self-center text-base">
              Code: {ALL_WEEK.code}
            </span>
          </div>
        </aside>

        <ol className="flex flex-col gap-8 md:gap-10">
          {EVENTS.map((event, idx) => (
            <EventRow key={event.title} event={event} index={idx} />
          ))}
        </ol>
      </div>
    </main>
  );
}
