/**
 * Builds the JSON body for an event announcement/reminder posted to a Discord
 * incoming webhook. Pure — no env reads, no fetch — so it unit-tests without
 * mocks; `lib/discord.ts` owns the webhook URL and the POST.
 *
 * Mirrors emails/BroadcastEmail: same description precedence (the event's own,
 * then the book synopsis, then the film plot) and the same film/book spec rows,
 * so the two channels say the same thing about an event.
 */

import type { Event } from '@/payload-types';
import type { BroadcastKind } from '@/lib/broadcasts';
import type { MovieData } from '@/lib/omdb';
import {
  DISCORD_EMBED_COLORS,
  EVENT_TYPE_LABELS,
} from '@/app/contsants/constants';

export type DiscordEmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

export type DiscordEmbed = {
  title: string;
  url?: string;
  description?: string;
  color: number;
  fields: DiscordEmbedField[];
  image?: { url: string };
  footer?: { text: string };
};

export type DiscordWebhookPayload = {
  content: string;
  embeds: DiscordEmbed[];
  /** Empty parse list: an "@everyone" typed into an event description is
   *  rendered as text instead of pinging the whole server. */
  allowed_mentions: { parse: [] };
};

export type BuildEventDiscordMessageInput = {
  kind: BroadcastKind;
  eventType: Event['eventType'];
  name: string;
  datetime: string;
  eventUrl: string;
  posterUrl?: string;
  /** The event's own description, already flattened out of Lexical. */
  description?: string;
  locationName?: string;
  locationAddress?: string;
  price?: number | null;
  movie?: MovieData | null;
  book?: {
    title?: string;
    author?: string;
    cover?: string;
    description?: string;
  } | null;
};

/**
 * Discord's hard caps. Going over any of them is a 400 from the webhook, and an
 * event description plus an OMDB plot can realistically reach them — so clip
 * rather than let a long write-up drop the whole post.
 */
const LIMIT = {
  content: 2000,
  title: 256,
  description: 4096,
  fieldValue: 1024,
  footer: 2048,
  /** Sum of title + description + footer + every field name and value. */
  total: 6000,
} as const;

const ELLIPSIS = '…';

function truncate(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  // No room for the marker itself — a bare slice, not slice(0, -1), which would
  // silently drop a character off the end instead of clipping to `max`.
  if (max <= ELLIPSIS.length) return trimmed.slice(0, Math.max(0, max));
  return trimmed.slice(0, max - ELLIPSIS.length).trimEnd() + ELLIPSIS;
}

/** What Discord counts against the 6000-character embed budget. */
function embedLength(embed: DiscordEmbed): number {
  return (
    embed.title.length +
    (embed.description?.length ?? 0) +
    (embed.footer?.text.length ?? 0) +
    embed.fields.reduce((n, f) => n + f.name.length + f.value.length, 0)
  );
}

/** One line, mirroring the email subjects in app/api/tasks/send-broadcast. */
const CONTENT = {
  announcement: (name: string, label: string) =>
    `**Coming up:** ${name} — ${label}`,
  reminder: (name: string, label: string) => `**Today:** ${name} — ${label}`,
} as const;

function whenField(datetime: string): DiscordEmbedField | null {
  const ms = new Date(datetime).getTime();
  if (Number.isNaN(ms)) return null;
  const unix = Math.floor(ms / 1000);
  // Discord renders these in each member's own timezone, which beats baking in
  // ET for a server that isn't all in Queens.
  return { name: 'When', value: `<t:${unix}:F>\n<t:${unix}:R>`, inline: true };
}

function whereField(
  name?: string,
  address?: string
): DiscordEmbedField | null {
  const value = [name, address].filter(Boolean).join('\n');
  if (!value) return null;
  return { name: 'Where', value: truncate(value, LIMIT.fieldValue), inline: true };
}

function detailsField(movie?: MovieData | null): DiscordEmbedField | null {
  if (!movie) return null;
  const rows = [
    movie.director && `**Director:** ${movie.director}`,
    movie.year && `**Year:** ${movie.year}`,
    [movie.rated, movie.runtime].filter(Boolean).join(' · '),
    movie.genre && `**Genre:** ${movie.genre}`,
    movie.imdbRating && `★ ${movie.imdbRating}`,
  ].filter(Boolean) as string[];
  if (rows.length === 0) return null;
  return {
    name: 'Details',
    value: truncate(rows.join('\n'), LIMIT.fieldValue),
    inline: false,
  };
}

function bookField(
  book?: BuildEventDiscordMessageInput['book']
): DiscordEmbedField | null {
  const value = [
    book?.title && `**${book.title}**`,
    book?.author && `by ${book.author}`,
  ]
    .filter(Boolean)
    .join('\n');
  if (!value) return null;
  return {
    name: 'The Book',
    value: truncate(value, LIMIT.fieldValue),
    inline: false,
  };
}

export function buildEventDiscordMessage(
  input: BuildEventDiscordMessageInput
): DiscordWebhookPayload {
  const {
    kind,
    eventType,
    name,
    datetime,
    eventUrl,
    posterUrl,
    description,
    locationName,
    locationAddress,
    price,
    movie,
    book,
  } = input;

  const label = EVENT_TYPE_LABELS[eventType];
  const isPaid = (price ?? 0) > 0;

  // Same precedence as BroadcastEmail: the event's own copy wins, then the book
  // synopsis, then the film plot.
  const body = description?.trim() || book?.description || movie?.plot || '';

  const fields = [
    whenField(datetime),
    whereField(locationName ?? undefined, locationAddress ?? undefined),
    isPaid
      ? {
          name: 'Tickets',
          value: `[Get tickets](${eventUrl}) — $${price}`,
          inline: false,
        }
      : null,
    eventType === 'bookclub' ? bookField(book) : detailsField(movie),
  ].filter((f): f is DiscordEmbedField => f !== null);

  const embed: DiscordEmbed = {
    title: truncate(name, LIMIT.title),
    url: eventUrl,
    color: DISCORD_EMBED_COLORS[eventType],
    fields,
    footer: { text: truncate(label, LIMIT.footer) },
    ...(body ? { description: truncate(body, LIMIT.description) } : {}),
    ...(posterUrl ? { image: { url: posterUrl } } : {}),
  };

  // Fields, title, and footer are all bounded and small; if the whole embed is
  // still over budget it is the description doing it, so give back exactly the
  // overflow rather than dropping the write-up entirely.
  const overflow = embedLength(embed) - LIMIT.total;
  if (overflow > 0 && embed.description) {
    embed.description = truncate(
      embed.description,
      Math.max(0, embed.description.length - overflow)
    );
  }

  return {
    content: truncate(CONTENT[kind](name, label), LIMIT.content),
    embeds: [embed],
    allowed_mentions: { parse: [] },
  };
}
