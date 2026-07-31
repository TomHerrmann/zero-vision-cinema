import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { RichText } from '@payloadcms/richtext-lexical/react';
import { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import {
  EMAIL_HEADER_IMAGE_ZVC_URL,
  LLC_NAME,
  RESEND_UNSUBSCRIBE_URL,
  ZVC_SITE_URL,
} from '@/app/contsants/constants';
import { richTextIsEmpty } from '@/utils/richText';
import type { MovieData } from '@/lib/omdb';

export type BroadcastKind = 'announcement' | 'reminder';
export type BroadcastEventType = 'zvc' | 'ahc' | 'bookclub';

/** Book details for book-club events (title/author from the event, cover/synopsis from Open Library). */
export type BookInfo = {
  title?: string;
  author?: string;
  cover?: string;
  description?: string;
};

interface Props {
  kind: BroadcastKind;
  /** Event type — drives the copy voice (ZVC / Astoria Horror Club / Book Club). */
  eventType: BroadcastEventType;
  /**
   * Whether the event is paid. Only a paid ZVC screening gets a "Get Tickets"
   * CTA; every free event (ZVC $0, AHC, book club) renders no CTA — the email
   * itself carries all the details, and there's nothing to buy or RSVP to.
   */
  paid?: boolean;
  /** Per-event-type header banner. */
  headerImage: string;
  eventName: string;
  eventImage?: string;
  /** ISO datetime of the event start. */
  eventDate: string;
  eventLocation: string;
  eventAddress?: string;
  eventDescription?: SerializedEditorState;
  /**
   * OMDB film data (plot, director, year, rating, …) when the event has an IMDb
   * id. Pass `null` (not undefined) to render no film details — undefined lets
   * the preview default apply.
   */
  movie?: MovieData | null;
  /** Book details for book-club events (Open Library). Takes priority over movie. */
  book?: BookInfo | null;
  /** Absolute link to the event page (tickets / details). */
  eventUrl?: string;
}

type VoiceKey = 'zvcPaid' | 'zvcFree' | 'ahc' | 'bookclub';
type Voice = {
  /** Only paid ZVC has a CTA; free events render none. */
  cta?: string;
  announcement: { kicker: string; blurb: string };
  reminder: { kicker: string; blurb: string };
};

// Copy is distinct per event type — and, for ZVC, whether it's a paid
// screening (the only case with a CTA). Free events carry every detail inline,
// so there's nothing to click through to.
const COPY: Record<VoiceKey, Voice> = {
  zvcPaid: {
    cta: 'Get Tickets',
    announcement: {
      kicker: 'On sale now',
      blurb:
        "Tickets are live for our next Zero Vision Cinema screening — grab your seat before they're gone.",
    },
    reminder: {
      kicker: 'Tonight',
      blurb:
        "Last call — tonight's screening is almost here. Get your tickets now.",
    },
  },
  zvcFree: {
    announcement: {
      kicker: 'Coming up',
      blurb:
        'Our next Zero Vision Cinema screening is free and open to all — no ticket needed. Here are the details.',
    },
    reminder: {
      kicker: 'Tonight',
      blurb:
        "Tonight's free Zero Vision Cinema screening is almost here. Just show up — we'll see you there.",
    },
  },
  ahc: {
    announcement: {
      kicker: 'Coming up',
      blurb:
        "The Astoria Horror Club's next free movie night is on the calendar. Here's what we're watching.",
    },
    reminder: {
      kicker: 'Tonight',
      blurb:
        'Astoria Horror Club is tonight — come watch something scary with us. No ticket needed.',
    },
  },
  bookclub: {
    announcement: {
      kicker: 'Next read',
      blurb:
        'Here’s the next Astoria Horror Book Club pick. Grab a copy, get reading, and join the discussion.',
    },
    reminder: {
      kicker: 'Tonight',
      blurb:
        'Astoria Horror Book Club meets tonight — come chat about this month’s read with us.',
    },
  },
};

function voiceKey(eventType: BroadcastEventType, paid?: boolean): VoiceKey {
  if (eventType === 'ahc') return 'ahc';
  if (eventType === 'bookclub') return 'bookclub';
  return paid ? 'zvcPaid' : 'zvcFree';
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'full',
    timeStyle: 'short',
  });
}

export default function BroadcastEmail({
  kind,
  eventType,
  paid,
  headerImage,
  eventName,
  eventImage,
  eventDate,
  eventLocation,
  eventAddress,
  eventDescription,
  movie,
  book,
  eventUrl,
}: Props) {
  const variant = COPY[voiceKey(eventType, paid)];
  const c = variant[kind];
  const descriptionIsEmpty = richTextIsEmpty(eventDescription);
  const hasBook = Boolean(book && (book.author || book.description));
  // Book club events show "About the Book"; everything else, "About the Film".
  const hasFilmDetails =
    !hasBook && Boolean(movie && (movie.director || movie.plot));

  return (
    <Html>
      <Head />
      <Preview>
        {c.kicker}: {eventName}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={headerImage} width="100%" alt={LLC_NAME} style={header} />
          <Section style={content}>
            <Text style={kicker}>{c.kicker}</Text>
            <Heading style={heading}>{eventName}</Heading>
            <Text style={blurb}>{c.blurb}</Text>

            {eventImage && (
              <Img src={eventImage} alt={eventName} style={poster} />
            )}

            {/* Description — the event's own, else the book synopsis / film plot */}
            {!descriptionIsEmpty ? (
              <div style={richTextWrap}>
                <RichText data={eventDescription!} />
              </div>
            ) : book?.description ? (
              <Text style={plot}>{book.description}</Text>
            ) : movie?.plot ? (
              <Text style={plot}>{movie.plot}</Text>
            ) : null}

            {/* About the Book — book-club events */}
            {hasBook && (
              <Section style={filmCard}>
                <table width="100%" cellPadding="0" cellSpacing="0">
                  <tr>
                    <td style={filmTitle}>About the Book</td>
                  </tr>
                </table>
                <SpecRow label="Title" value={book?.title} />
                <SpecRow label="Author" value={book?.author} />
              </Section>
            )}

            {/* About the Film — everything else with OMDB data */}
            {hasFilmDetails && (
              <Section style={filmCard}>
                <table width="100%" cellPadding="0" cellSpacing="0">
                  <tr>
                    <td style={filmTitle}>About the Film</td>
                    {movie?.imdbRating && (
                      <td style={rating}>★ {movie.imdbRating}</td>
                    )}
                  </tr>
                </table>
                <SpecRow label="Director" value={movie?.director} />
                <SpecRow label="Starring" value={movie?.actors} />
                <SpecRow label="Year" value={movie?.year} />
                <SpecRow
                  label="Rated · Runtime"
                  value={[movie?.rated, movie?.runtime]
                    .filter(Boolean)
                    .join(' · ')}
                />
                <SpecRow label="Genre" value={movie?.genre} />
              </Section>
            )}

            {/* When / Where */}
            <Section style={details}>
              <Text style={detailRow}>
                <span style={label}>When</span>
                {formatEventDate(eventDate)}
              </Text>
              <Text style={detailRow}>
                <span style={label}>Where</span>
                {eventLocation}
                {eventAddress ? ` — ${eventAddress}` : ''}
              </Text>
            </Section>

            {/* CTA only for paid ZVC screenings — free events have nothing to
                buy or RSVP to, so the email itself is the full detail. */}
            {variant.cta && eventUrl && (
              <Link href={eventUrl} style={button}>
                {variant.cta}
              </Link>
            )}
          </Section>

          <Section style={footer}>
            <Text style={footerText}>{LLC_NAME}</Text>
            <Text style={footerText}>
              You&apos;re receiving this because you subscribed to Zero Vision
              Cinema updates.{' '}
              <Link href={RESEND_UNSUBSCRIBE_URL} style={footerLink}>
                Unsubscribe
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function SpecRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      style={{ borderTop: '1px solid rgba(255,253,246,0.1)' }}
    >
      <tr>
        <td style={specLabel}>{label}</td>
        <td style={specValue}>{value}</td>
      </tr>
    </table>
  );
}

const main: React.CSSProperties = {
  backgroundColor: '#141414',
  fontFamily: 'Arial, Helvetica, sans-serif',
  margin: 0,
  padding: '24px 0',
};
const container: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#1F1F1F',
  border: '1px solid rgba(255,253,246,0.12)',
};
const header: React.CSSProperties = { display: 'block' };
const content: React.CSSProperties = { padding: '32px 28px' };
const kicker: React.CSSProperties = {
  color: '#4A8CC6',
  textTransform: 'uppercase',
  letterSpacing: '2px',
  fontSize: '12px',
  margin: '0 0 8px',
};
const heading: React.CSSProperties = {
  color: '#FFFDF6',
  fontSize: '30px',
  lineHeight: '1.15',
  margin: '0 0 12px',
};
const blurb: React.CSSProperties = {
  color: 'rgba(255,253,246,0.8)',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 20px',
};
const poster: React.CSSProperties = {
  width: '100%',
  maxWidth: '280px',
  border: '2px solid rgba(255,253,246,0.15)',
  margin: '0 0 20px',
};
const richTextWrap: React.CSSProperties = {
  color: 'rgba(255,253,246,0.8)',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 20px',
};
const plot: React.CSSProperties = {
  color: 'rgba(255,253,246,0.8)',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 20px',
};
const filmCard: React.CSSProperties = {
  border: '1px solid rgba(255,253,246,0.12)',
  backgroundColor: '#262626',
  padding: '14px 16px',
  margin: '0 0 24px',
};
const filmTitle: React.CSSProperties = {
  color: '#4A8CC6',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  fontSize: '11px',
  fontWeight: 'bold',
};
const rating: React.CSSProperties = {
  color: '#4A8CC6',
  fontSize: '13px',
  fontWeight: 'bold',
  textAlign: 'right',
  whiteSpace: 'nowrap',
};
const specLabel: React.CSSProperties = {
  color: 'rgba(255,253,246,0.6)',
  fontSize: '13px',
  padding: '8px 8px 8px 0',
  verticalAlign: 'top',
  width: '38%',
};
const specValue: React.CSSProperties = {
  color: 'rgba(255,253,246,0.9)',
  fontSize: '13px',
  padding: '8px 0',
  textAlign: 'right',
};
const details: React.CSSProperties = {
  borderTop: '1px solid rgba(255,253,246,0.12)',
  borderBottom: '1px solid rgba(255,253,246,0.12)',
  padding: '12px 0',
  margin: '0 0 24px',
};
const detailRow: React.CSSProperties = {
  color: 'rgba(255,253,246,0.9)',
  fontSize: '14px',
  margin: '8px 0',
};
const label: React.CSSProperties = {
  display: 'block',
  color: '#4A8CC6',
  textTransform: 'uppercase',
  fontSize: '11px',
  letterSpacing: '1px',
  marginBottom: '2px',
};
const button: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#4A8CC6',
  color: '#0f0f0f',
  fontWeight: 'bold',
  fontSize: '15px',
  textDecoration: 'none',
  padding: '14px 26px',
};
const footer: React.CSSProperties = {
  backgroundColor: '#09090b',
  padding: '20px 28px',
  textAlign: 'center',
};
const footerText: React.CSSProperties = {
  color: '#a1a1aa',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '0 0 4px',
};
const footerLink: React.CSSProperties = {
  color: '#a1a1aa',
  textDecoration: 'underline',
};
