/**
 * Halloweek 2026 — Sat Oct 24 through Sat Oct 31.
 *
 * All the page copy lives here so the layout in `page.tsx` never has to change
 * when a title, time, venue, or blurb does.
 *
 * This is an informational listing, not a ticketed one: every ZVC event in the
 * series is free and the page sells nothing. The only ticket links are a
 * sponsor's own, in `HALLOWEEK_SPONSORS`.
 *
 */

import { ZERO_VISION_BLOB_URL } from '@/app/contsants/constants';

const HALLOWEEK_BLOB = `${ZERO_VISION_BLOB_URL}/halloweek2026`;

/**
 * Halloweek artwork. The event flyers are all 1080×1350 — 4:5, Instagram's
 * portrait ratio — which is the ratio the card frames use, so nothing is
 * cropped. Sponsor art varies (see each entry below).
 */
export const HALLOWEEK_IMAGES = {
  scaryStreets: `${HALLOWEEK_BLOB}/1024-scarystreets.png`,
  horrorBrunch: `${HALLOWEEK_BLOB}/1025-brunch.png`,
  astoriaHorrorClub: `${HALLOWEEK_BLOB}/1026-ahc.png`,
  bookClub: `${HALLOWEEK_BLOB}/1027-bookclub.png`,
  spookySounds: `${HALLOWEEK_BLOB}/1028-spookysounds.png`,
  brewscares: `${HALLOWEEK_BLOB}/1029-brewscares.png`,
  scaryoke: `${HALLOWEEK_BLOB}/1030-scaryoke.png`,
  halloweenParty: `${HALLOWEEK_BLOB}/1031-party.png`,
  sponsors: {
    /** 900×900 — white wordmark on black, so it sits flush on the dark panel. */
    momi: `${HALLOWEEK_BLOB}/sponsors/momi.jpg`,
    /** 1080×1350 — fills the 4:5 frame exactly. */
    audible: `${HALLOWEEK_BLOB}/sponsors/audible.jpg`,
    /** 1600×800 production still — letterboxed in the portrait frame. */
    wevegotspirit: `${HALLOWEEK_BLOB}/sponsors/We-ve-Got-Spirit-At-Theaterlab-1783846038.avif`,
  },
} as const;

export type HalloweekVenue = {
  name: string;
  /** Street address, paired with the name to build the Google Maps link. */
  address: string;
};

export type HalloweekSlot = {
  /** Anchor id, unique per slot. */
  id: string;
  /** ISO datetime with the Eastern offset (EDT, -04:00, through Nov 1 2026). */
  datetime: string;
  title: string;
  /** Series label above the title, e.g. "Opening Night". */
  kicker?: string;
  /** Credits / billing line under the title. */
  meta?: string;
  description: string;
  venueName: string;
  /** Poster or still. Absolute URL (Vercel blob) or a path under /public. */
  image?: string;
  /** Short flags shown as chips. */
  tags?: string[];
};

export type HalloweekSponsor = {
  name: string;
  /** Logo or key art. Absolute URL (Vercel blob) or a path under /public. */
  image?: string;
  /**
   * How the image sits in its frame. `contain` (the default) shows a logo
   * whole; `cover` fills the frame with key art and may crop it.
   */
  imageFit?: 'cover' | 'contain';
  /** One or more paragraphs about the sponsor. */
  blurb: string[];
  /** Discount / offer for the ZVC community. */
  offer?: {
    text: string;
    /** Promo code, rendered as a copyable-looking chip. */
    code?: string;
    url?: string;
    ctaLabel?: string;
  };
  /** Optional extra block below the blurb, e.g. a show synopsis. */
  extra?: { heading: string; body: string };
};

export const HALLOWEEK = {
  name: 'Halloweek',
  year: 2026,
  /** Display range — keep in sync with the first/last slot. */
  dateRange: 'October 24 – 31, 2026',
  tagline: 'Halloweek returns to Astoria and LIC.',
  intro: [
    'Get spooky with your neighbors the entire week leading up to Halloween ' +
      'at all of our free events. We have something going on for anyone who ' +
      'loves All Hallows Eve, from Saturday October 24th all the way through ' +
      'to the big day, Saturday October 31st.',
    'This is the second year Zero Vision Cinema is putting together a ' +
      "Halloweek series, and we were so excited with how last year's went " +
      'that we have even more going on. Check out the lineup below.',
  ],
} as const;

export const HALLOWEEK_VENUES: HalloweekVenue[] = [
  {
    name: 'Ditmars Open Streets',
    address: '33-07 Ditmars Blvd, Astoria, NY 11105',
  },
  {
    name: 'The Gaf',
    address: '47-22 30th Ave., Astoria, NY 11103',
  },
  {
    name: 'The Ditty',
    address: '35-03 Ditmars Blvd, Astoria, NY 11105',
  },
  {
    name: 'Medusa Art Studio',
    address: '18-14 Astoria Blvd, Astoria, NY 11102',
  },
  {
    name: 'SingleCut',
    address: '19-33 37th St, Astoria, NY 11105',
  },
  {
    name: 'QED',
    address: '27-16 23rd Ave, Astoria, NY 11105',
  },
  {
    name: "Sissy McGinty's",
    address: '25-67 Steinway St, Astoria, NY 11103',
  },
  {
    name: 'Focal Point Beer Co',
    address: '43-50 12th St, Long Island City, NY 11101',
  },
];

/**
 * One entry per event, in chronological order. A day with two entries renders
 * as two cards under the same date header.
 */
export const HALLOWEEK_SCHEDULE: HalloweekSlot[] = [
  {
    id: 'scary-streets',
    image: HALLOWEEK_IMAGES.scaryStreets,
    datetime: '2026-10-24T19:00:00-04:00',
    title: 'Scary Streets',
    kicker: 'Opening Night',
    meta: "Stephen King's It",
    description:
      "If you've been to our movies on 31st Ave Open Street in years past, " +
      'you know how much fun it was seeing Poltergeist, The Final Girls, and ' +
      'Halloweentown. This year we are moving up to Ditmars Open Streets and ' +
      "showing Stephen King's It. Starring the late, great Tim Curry, this " +
      'made-for-TV movie will fill you with childhood nostalgia and dread.',
    venueName: 'Ditmars Open Streets',
    tags: ['Outdoor screening'],
  },
  {
    id: 'horror-brunch',
    image: HALLOWEEK_IMAGES.horrorBrunch,
    datetime: '2026-10-25T13:00:00-04:00',
    title: 'Horror Brunch: Video Tape Terror',
    meta: 'All-VHS marathon · you pick the movies',
    description:
      'One of our most beloved local events is back. Horror Brunch at ' +
      'The Gaf is a longstanding series that pairs the weirdest ' +
      'horror movies we can find, and the best takeout brunch you can order. ' +
      'Come and vote on what we watch throughout the day. This time, every ' +
      'movie in this marathon will be screened on glorious, low-fi VHS — so ' +
      'bring your own tapes.',
    venueName: 'The Gaf',
    tags: ['BYO VHS', 'Audience vote'],
  },
  {
    id: 'astoria-horror-club',
    image: HALLOWEEK_IMAGES.astoriaHorrorClub,
    datetime: '2026-10-26T19:00:00-04:00',
    title: 'Astoria Horror Club',
    meta: 'Halloween II · on VHS',
    description:
      'This is the one that started it all. Come out to The Ditty for a ' +
      'special screening of Halloween II (also on VHS). Since we started the ' +
      "Club back in 2021, we've shown a Michael Myers movie every year in " +
      'October. This time we are going back to a true fan favorite.',
    venueName: 'The Ditty',
    tags: ['VHS', 'Club night'],
  },
  {
    id: 'astoria-horror-book-club',
    image: HALLOWEEK_IMAGES.bookClub,
    datetime: '2026-10-27T19:00:00-04:00',
    title: 'Astoria Horror Book Club',
    meta: 'The Ghosts of Gwendolyn Montgomery — Clarence A. Haynes',
    description:
      "There's more than just movies for the Halloween season. Get your copy " +
      'of The Ghosts of Gwendolyn Montgomery by Clarence A. Haynes and come ' +
      'out to Medusa Art Studio for a lively discussion. This is a cozy ' +
      'ghostly tale about the barrier between the living and the dead growing ' +
      'thin. The perfect read to pair with your pumpkin spice latte.',
    venueName: 'Medusa Art Studio',
    tags: ['Book club'],
  },
  {
    id: 'spooky-sounds',
    image: HALLOWEEK_IMAGES.spookySounds,
    datetime: '2026-10-28T19:00:00-04:00',
    title: 'Spooky Sounds',
    meta: 'Strawberry Blonde · Powdermaker · and more',
    description:
      'A true ZVC celebration, we are bringing you an evening of live music ' +
      'with some phenomenal local bands. Hear Strawberry Blonde, Powdermaker ' +
      'and more! Join us at SingleCut as the bands take the stage to videos of ' +
      "classic horror. It's a night of rock right here in Astoria.",
    venueName: 'SingleCut',
    tags: ['Live music'],
  },
  {
    id: 'brewscares',
    image: HALLOWEEK_IMAGES.brewscares,
    datetime: '2026-10-29T19:30:00-04:00',
    title: 'Brewscares',
    meta: '90s horror TV + live comedy',
    description:
      'This one brings you comics and good old 90s horror TV. Join us at QED ' +
      'where we will be watching spooky episodes of kids television, while a ' +
      "comedian prepares to riff on what we just watched. It's an evening of " +
      'thrills and laughs that your inner child would die for.',
    venueName: 'QED',
    tags: ['Live comedy'],
  },
  {
    id: 'scaryoke',
    image: HALLOWEEK_IMAGES.scaryoke,
    datetime: '2026-10-30T22:00:00-04:00',
    title: 'Scaryoke',
    meta: 'Halloween karaoke',
    description:
      "A new addition to this year's Halloweek, we are partnering with Sissy " +
      "McGinty's for karaoke, Halloween style. Come dressed up and join your " +
      'hosts as we belt out our favorite tunes. Expect some classics with some ' +
      "Halloween tunes thrown in the mix. It's the perfect event to start " +
      'Halloweekend!',
    venueName: "Sissy McGinty's",
    tags: ['Karaoke', 'Costumes welcome'],
  },
  {
    id: 'halloween-party',
    image: HALLOWEEK_IMAGES.halloweenParty,
    datetime: '2026-10-31T20:00:00-04:00',
    title: '5th Annual Halloween Party',
    kicker: 'Halloween Night',
    meta: 'Costume contest + scary movie power hour',
    description:
      'Our biggest event of the year is our annual Halloween party! Join us ' +
      'at Focal Point Beer Co as we kick the night off with our costume ' +
      'contest. Top prizes include picking a film for a future Astoria Horror ' +
      'Club and 2 tickets to A Ghost in Your Ear. The main event is a scary ' +
      'movie inspired power hour: 60 minutes with 60 second clips designed to ' +
      'delight, horrify, and scare even the most dedicated horror fans.',
    venueName: 'Focal Point Beer Co',
    tags: ['Costume contest', 'Power hour', 'Prizes'],
  },
];

export const HALLOWEEK_SPONSORS: HalloweekSponsor[] = [
  {
    name: 'Museum of the Moving Image',
    image: HALLOWEEK_IMAGES.sponsors.momi,
    blurb: [
      'A true local gem. This Halloween season, MoMI is presenting a buffet of ' +
        'monster-pieces that run the gamut from hilarious to horrifying, from ' +
        'beautiful to blasphemous, but which all revel in the tactile: ' +
        'vampires, werewolves, amphibious monsters, and hell-raising demons ' +
        'always ready to play.',
    ],
    offer: {
      text:
        'Members of the Zero Vision Cinema community can enjoy a special ' +
        'Halloweek discount of 20% off all screenings and museum entries from ' +
        'October 25th to October 31st.',
      code: 'ZeroVision20',
      url: 'https://movingimage.org/',
      ctaLabel: 'Visit MoMI',
    },
  },
  {
    name: "Audible's A Ghost In Your Ear",
    image: HALLOWEEK_IMAGES.sponsors.audible,
    // Already 4:5, so it fills the frame with nothing cropped.
    imageFit: 'cover',
    blurb: [
      'NOW EXTENDED BY POPULAR DEMAND through November 22 only, see Lucas ' +
        "Iverson (HBO’s The Pitt) and Owen Campbell (A24's X) take the stage " +
        'in A GHOST IN YOUR EAR, the “truly terrifying headphone horror” (The ' +
        'Guardian) from the darkly brilliant mind of Tony Award® nominee Jamie ' +
        'Armitage (Six), created in collaboration with Ben and Max Ringham ' +
        '(ANNA, National Theatre).',
      'Immersive, groundbreaking and just the right amount of chilling, the ' +
        'story follows an actor who enters a sound studio to record a ghost ' +
        'story — but soon, the horrors begin coming to life all around him. ' +
        'Audience members wear headphones during the performance, with ' +
        'binaural sound technology making every whisper, footstep and creak ' +
        'feel startlingly close. And at Audible’s Minetta Lane Theatre — one ' +
        'of New York’s most intimate venues — there’s no escaping the frights.',
    ],
    offer: {
      text: 'Enter if you dare. Use code GHOST20 for a discount.',
      code: 'GHOST20',
      ctaLabel: 'Get tickets',
      url: 'https://audiblexminetta.com/shows/a-ghost-in-your-ear',
    },
  },
  {
    name: "We've Got Spirit",
    image: HALLOWEEK_IMAGES.sponsors.wevegotspirit,
    blurb: [
      'From Sleepaway Camp to A Nightmare on Elm Street 2, horror has always ' +
        "been laced with queer culture. WE'VE GOT SPIRIT is a 90 minute " +
        'horror play inspired by queer figures of 1980s horror.',
      'See the show live on October 24th at 2pm and receive a special discount ' +
        'when you use the promo code below. We’ll be hosting a special talkback ' +
        'with the cast and creators after the show, with plenty of time to get ' +
        'to Ditmars for our Scary Streets movie later that night.',
    ],
    offer: {
      text: 'Special discount for the ZVC community.',
      code: 'astoriahorror',
      url: 'https://theaterlabnyc.com/tlab-shares-weve-got-spirit/',
      ctaLabel: 'Get tickets',
    },
    extra: {
      heading: 'Synopsis',
      body:
        'In 2004 rural Tennessee, the employees of a Spirit Halloween store ' +
        'welcomed new member Damien, a conservative young male whose family ' +
        'previously owned the building when it was a church. When a member of ' +
        'the team becomes the center of a hate crime, they barricade ' +
        'themselves in the store. We’ve Got Spirit explores the fears of ' +
        'southern LGBTQ+ communities and the instilled paranoia surrounding ' +
        'the end of days.',
    },
  },
];

export const HALLOWEEK_FAQS: { question: string; answer: string }[] = [
  {
    question: 'Do I need a ticket?',
    answer:
      'No. Every Zero Vision Cinema event in the Halloweek lineup is free — ' +
      'just show up. (Our sponsors run their own ticketed shows; those links ' +
      'and discount codes are above.)',
  },
  {
    question: 'How early should I get there?',
    answer:
      'Halloweek is the busiest week of our year. Come early if you want a ' +
      'good seat — and you’ll get time to hang out with the rest of the ' +
      'neighborhood’s horror crowd, which is half the reason we do this.',
  },
  {
    question: 'Should I come in costume?',
    answer:
      'Yes for Scaryoke on Friday the 30th, and absolutely for the 5th Annual ' +
      'Halloween Party on the 31st, which opens with our costume contest. ' +
      'Top prizes include picking a film for a future Astoria Horror Club and ' +
      '2 tickets to A Ghost in Your Ear.',
  },
];

/* --------------------------------------------------------------------------
 * Derived helpers — the page renders from these, so the data above stays the
 * single source of truth.
 * ------------------------------------------------------------------------ */

const ET = 'America/New_York';

export const formatDayLong = (datetime: string) =>
  new Date(datetime).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: ET,
  });

export const formatTime = (datetime: string) =>
  new Date(datetime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: ET,
  });

const VENUES_BY_NAME = new Map(HALLOWEEK_VENUES.map((v) => [v.name, v]));

/**
 * Google Maps link for a venue, or `null` if the name isn't one we know — an
 * unlinked venue name beats a link to the wrong place.
 *
 * The query pairs name with street address: name alone can hit the wrong
 * branch, and a bare address can land on the building next door.
 */
export const venueMapUrl = (venueName: string): string | null => {
  const venue = VENUES_BY_NAME.get(venueName);
  if (!venue) return null;

  const query = `${venue.name}, ${venue.address}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
};
