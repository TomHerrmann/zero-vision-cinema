import { Img, Section, Text } from '@react-email/components';
import { RichText } from '@payloadcms/richtext-lexical/react';
import { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import { LLC_NAME, RESEND_UNSUBSCRIBE_URL } from '@/app/contsants/constants';
import { richTextIsEmpty } from '@/utils/richText';
import type { MovieData } from '@/lib/omdb';
import {
  BODY_FONT,
  BrandFooter,
  BrandHeader,
  EmailShell,
  FooterLine,
  FooterLink,
  GLOW,
  HEADLINE_FONT,
  Kicker,
  LABEL_FONT,
  Label,
  PrimaryButton,
  RETRO_BLUE,
  Row,
  STATIC,
  Title,
  bodyTextStyle,
  contentStyle,
  panelStyle,
} from './components/brand';

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
  /**
   * Per-event-type header banner. ZVC events use the brand logo header instead;
   * Astoria Horror Club and Book Club keep their own banners.
   */
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
        'Our next Zero Vision Cinema event is free and open to all — no ticket needed. Here are the details.',
    },
    reminder: {
      kicker: 'Tonight',
      blurb:
        "Tonight's free Zero Vision Cinema event is almost here. Just show up — we'll see you there.",
    },
  },
  ahc: {
    announcement: {
      kicker: 'Coming up',
      blurb:
        "Astoria Horror Club's next movie night is set. Here's what we're watching.",
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

function formatEventDate(iso: string): { day: string; time: string } {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
    time: d.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      timeStyle: 'short',
    }),
  };
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
  const showCta = Boolean(variant.cta && eventUrl);
  const { day, time } = formatEventDate(eventDate);

  return (
    <EmailShell preview={`${c.kicker}: ${eventName}`}>
      {eventType === 'zvc' ? (
        <BrandHeader />
      ) : (
        <Img src={headerImage} width="100%" alt={LLC_NAME} style={banner} />
      )}
      <Section style={contentStyle} className="zvc-pad">
        <Kicker>{c.kicker}</Kicker>
        <Title>{eventName}</Title>
        <Text style={bodyTextStyle}>{c.blurb}</Text>

        {/* Poster beside When / Where (stacks on a phone) */}
        <table
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          role="presentation"
          style={{ margin: '8px 0 28px' }}
        >
          <tr>
            {eventImage && (
              <td
                width="220"
                className="zvc-stack zvc-stack-gap"
                style={{ width: '220px', verticalAlign: 'top', paddingRight: '24px' }}
              >
                <Img src={eventImage} width="220" alt={eventName} style={poster} />
              </td>
            )}
            <td className="zvc-stack" style={{ verticalAlign: 'middle' }}>
              <Label>When</Label>
              <Text style={whenDay}>{day}</Text>
              <Text style={whenTime}>{time}</Text>
              <Label>Where</Label>
              <Text style={whereName}>{eventLocation}</Text>
              {eventAddress && <Text style={whereAddress}>{eventAddress}</Text>}
              {/* CTA only for paid ZVC screenings — free events have nothing to
                  buy or RSVP to, so the email itself is the full detail. */}
              {showCta && (
                <div style={{ paddingTop: '22px' }}>
                  <PrimaryButton href={eventUrl!}>{variant.cta}</PrimaryButton>
                </div>
              )}
            </td>
          </tr>
        </table>

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
          <Section style={panelStyle}>
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
              <tr>
                <td style={panelTitle}>About the Book</td>
              </tr>
            </table>
            <Row label="Title" value={book?.title} />
            <Row label="Author" value={book?.author} last />
          </Section>
        )}

        {/* About the Film — everything else with OMDB data */}
        {hasFilmDetails && (
          <Section style={panelStyle}>
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
              <tr>
                <td style={panelTitle}>About the Film</td>
                {movie?.imdbRating && (
                  <td style={rating}>★ {movie.imdbRating}</td>
                )}
              </tr>
            </table>
            <Row label="Director" value={movie?.director} />
            <Row label="Starring" value={movie?.actors} />
            <Row label="Year" value={movie?.year} />
            <Row
              label="Rated · Runtime"
              value={[movie?.rated, movie?.runtime].filter(Boolean).join(' · ')}
            />
            <Row label="Genre" value={movie?.genre} last />
          </Section>
        )}

        {showCta && (
          <Section style={{ textAlign: 'center', margin: '8px 0 0' }}>
            <PrimaryButton href={eventUrl!}>{variant.cta}</PrimaryButton>
          </Section>
        )}
      </Section>

      <BrandFooter>
        <FooterLine>
          You&apos;re receiving this because you subscribed to Zero Vision
          Cinema updates.{' '}
          <FooterLink href={RESEND_UNSUBSCRIBE_URL}>Unsubscribe</FooterLink>
        </FooterLine>
      </BrandFooter>
    </EmailShell>
  );
}

const banner: React.CSSProperties = { display: 'block', width: '100%' };
const poster: React.CSSProperties = {
  display: 'block',
  width: '220px',
  maxWidth: '100%',
  height: 'auto',
  borderRadius: '2px',
};
const whenDay: React.CSSProperties = {
  fontFamily: HEADLINE_FONT,
  fontWeight: 700,
  letterSpacing: '0.05em',
  fontSize: '26px',
  lineHeight: '1.05',
  textTransform: 'uppercase',
  color: GLOW,
  margin: '0 0 2px',
};
const whenTime: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '18px',
  color: GLOW,
  margin: '0 0 18px',
};
const whereName: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '19px',
  fontWeight: 700,
  color: GLOW,
  margin: 0,
};
const whereAddress: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '16px',
  color: STATIC,
  margin: '2px 0 0',
};
const richTextWrap: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '18px',
  lineHeight: '1.55',
  color: GLOW,
  margin: '0 0 24px',
};
const plot: React.CSSProperties = { ...richTextWrap };
const panelTitle: React.CSSProperties = {
  fontFamily: LABEL_FONT,
  fontWeight: 700,
  fontSize: '12px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: RETRO_BLUE,
  paddingBottom: '6px',
};
const rating: React.CSSProperties = {
  ...panelTitle,
  textAlign: 'right',
  whiteSpace: 'nowrap',
};
