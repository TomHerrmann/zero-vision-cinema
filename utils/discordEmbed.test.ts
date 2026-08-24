import { describe, it, expect } from 'vitest';
import {
  buildEventDiscordMessage,
  type BuildEventDiscordMessageInput,
  type DiscordEmbed,
} from './discordEmbed';
import {
  DISCORD_EMBED_COLORS,
  EVENT_TYPE_LABELS,
} from '@/app/contsants/constants';

const DATETIME = '2026-08-19T23:00:00.000Z';
const UNIX = Math.floor(new Date(DATETIME).getTime() / 1000);

const base: BuildEventDiscordMessageInput = {
  kind: 'announcement',
  eventType: 'zvc',
  name: 'Suspiria',
  datetime: DATETIME,
  eventUrl: 'https://zerovisioncinema.com/events/7',
  locationName: 'The Coop',
  locationAddress: '1 Main St, Astoria NY',
  price: 10,
};

const build = (over: Partial<BuildEventDiscordMessageInput> = {}) =>
  buildEventDiscordMessage({ ...base, ...over });

const embedOf = (over: Partial<BuildEventDiscordMessageInput> = {}) =>
  build(over).embeds[0];

const field = (embed: DiscordEmbed, name: string) =>
  embed.fields.find((f) => f.name === name);

/** What Discord counts against its 6000-character embed budget. */
const embedLength = (embed: DiscordEmbed) =>
  embed.title.length +
  (embed.description?.length ?? 0) +
  (embed.footer?.text.length ?? 0) +
  embed.fields.reduce((n, f) => n + f.name.length + f.value.length, 0);

describe('buildEventDiscordMessage', () => {
  it('leads with the announcement line', () => {
    expect(build({ kind: 'announcement' }).content).toBe(
      '**Coming up:** Suspiria — Zero Vision Cinema'
    );
  });

  it('leads with the reminder line on the day', () => {
    expect(build({ kind: 'reminder' }).content).toBe(
      '**Today:** Suspiria — Zero Vision Cinema'
    );
  });

  it('never pings the server', () => {
    expect(build().allowed_mentions).toEqual({ parse: [] });
  });

  it('links the title to the event and stamps the brand color', () => {
    const embed = embedOf();
    expect(embed.title).toBe('Suspiria');
    expect(embed.url).toBe('https://zerovisioncinema.com/events/7');
    expect(embed.color).toBe(DISCORD_EMBED_COLORS.zvc);
    expect(embed.footer?.text).toBe(EVENT_TYPE_LABELS.zvc);
  });

  it.each(['zvc', 'ahc', 'bookclub'] as const)(
    'uses the %s color and label',
    (eventType) => {
      const embed = embedOf({ eventType });
      expect(embed.color).toBe(DISCORD_EMBED_COLORS[eventType]);
      expect(embed.footer?.text).toBe(EVENT_TYPE_LABELS[eventType]);
    }
  );

  it('renders the date as a Discord timestamp so members see their own zone', () => {
    expect(field(embedOf(), 'When')?.value).toBe(
      `<t:${UNIX}:F>\n<t:${UNIX}:R>`
    );
  });

  it('omits the When field rather than posting an unparseable date', () => {
    expect(field(embedOf({ datetime: 'not a date' }), 'When')).toBeUndefined();
  });

  it('joins the location name and address', () => {
    expect(field(embedOf(), 'Where')?.value).toBe(
      'The Coop\n1 Main St, Astoria NY'
    );
  });

  it('omits Where when there is no location', () => {
    const embed = embedOf({
      locationName: undefined,
      locationAddress: undefined,
    });
    expect(field(embed, 'Where')).toBeUndefined();
  });

  it('shows a ticket link only for paid events', () => {
    expect(field(embedOf({ price: 10 }), 'Tickets')?.value).toBe(
      '[Get tickets](https://zerovisioncinema.com/events/7) — $10'
    );
    expect(field(embedOf({ price: 0 }), 'Tickets')).toBeUndefined();
    expect(field(embedOf({ price: null }), 'Tickets')).toBeUndefined();
  });

  it('attaches the poster when there is one', () => {
    expect(embedOf({ posterUrl: 'https://img/p.jpg' }).image).toEqual({
      url: 'https://img/p.jpg',
    });
    expect(embedOf().image).toBeUndefined();
  });

  describe('description precedence (mirrors BroadcastEmail)', () => {
    const movie = { plot: 'A ballet school with a secret.' } as NonNullable<
      BuildEventDiscordMessageInput['movie']
    >;
    const book = { description: 'A rabbit, cursed.' };

    it("prefers the event's own copy", () => {
      expect(embedOf({ description: 'Ours', movie, book }).description).toBe(
        'Ours'
      );
    });

    it('falls back to the book synopsis', () => {
      expect(embedOf({ description: '   ', movie, book }).description).toBe(
        'A rabbit, cursed.'
      );
    });

    it('falls back to the film plot', () => {
      expect(embedOf({ movie }).description).toBe(
        'A ballet school with a secret.'
      );
    });

    it('omits the description entirely when there is nothing to say', () => {
      expect(embedOf().description).toBeUndefined();
    });
  });

  it('lists film specs for screenings', () => {
    const embed = embedOf({
      movie: {
        director: 'Dario Argento',
        year: '1977',
        rated: 'R',
        runtime: '99 min',
        genre: 'Horror',
        imdbRating: '7.4',
      } as NonNullable<BuildEventDiscordMessageInput['movie']>,
    });
    expect(field(embed, 'Details')?.value).toBe(
      '**Director:** Dario Argento\n**Year:** 1977\nR · 99 min\n**Genre:** Horror\n★ 7.4'
    );
    expect(field(embed, 'The Book')).toBeUndefined();
  });

  it('lists the book instead for book club', () => {
    const embed = embedOf({
      eventType: 'bookclub',
      price: 0,
      book: { title: 'Cursed Bunny', author: 'Bora Chung' },
      movie: { director: 'Nobody' } as NonNullable<
        BuildEventDiscordMessageInput['movie']
      >,
    });
    expect(field(embed, 'The Book')?.value).toBe(
      '**Cursed Bunny**\nby Bora Chung'
    );
    expect(field(embed, 'Details')).toBeUndefined();
  });

  describe('Discord size limits', () => {
    it('clips an over-long title to 256', () => {
      const embed = embedOf({ name: 'z'.repeat(400) });
      expect(embed.title).toHaveLength(256);
      expect(embed.title.endsWith('…')).toBe(true);
    });

    it('clips an over-long description to 4096', () => {
      const embed = embedOf({ description: 'z'.repeat(9000) });
      expect(embed.description).toHaveLength(4096);
    });

    it('clips an over-long location to 1024', () => {
      const embed = embedOf({ locationAddress: 'z'.repeat(2000) });
      expect(field(embed, 'Where')?.value).toHaveLength(1024);
    });

    it('keeps the whole embed inside the 6000 budget', () => {
      const embed = embedOf({
        name: 'z'.repeat(400),
        description: 'y'.repeat(9000),
        locationAddress: 'x'.repeat(2000),
        movie: {
          director: 'w'.repeat(2000),
          genre: 'v'.repeat(2000),
        } as NonNullable<BuildEventDiscordMessageInput['movie']>,
      });
      expect(embedLength(embed)).toBeLessThanOrEqual(6000);
      // Trimmed to fit, not dropped.
      expect(embed.description?.length).toBeGreaterThan(0);
    });

    it('clips the content line to 2000', () => {
      expect(build({ name: 'z'.repeat(3000) }).content).toHaveLength(2000);
    });
  });
});
