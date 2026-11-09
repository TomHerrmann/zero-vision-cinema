import { Img, Link, Section, Text } from '@react-email/components';
import { RichText } from '@payloadcms/richtext-lexical/react';
import { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import {
  EMAIL_HEADER_IMAGE_ZVC_URL,
  LLC_NAME,
  RESEND_UNSUBSCRIBE_URL,
} from '@/app/constants/constants';
import { richTextIsEmpty } from '@/utils/richText';
import {
  BLACKOUT,
  BLUE_LIGHT,
  BODY_FONT,
  BrandFooter,
  CONTENT_WIDTH,
  CULT_CLASSIC,
  EmailShell,
  FooterLine,
  FooterLink,
  GLOW,
  HAIRLINE,
  HEADLINE_FONT,
  LABEL_FONT,
  PANEL,
  RETRO_BLUE,
  STATIC,
} from './components/brand';

/** Tom and Mary's line, the same every week. */
export const WEEKLY_INTRO = "See what's playing at your NYC film community.";

export type WeeklyEvent = {
  id: number;
  /** Full event-type name, e.g. "Rewind Wednesdays". */
  typeName: string;
  title: string;
  /** ISO datetime of the event start. */
  datetime: string;
  venue: string;
  posterUrl?: string;
  /** The event's own description from Payload; preferred when not empty. */
  description?: SerializedEditorState | null;
  /** Book synopsis (Open Library) or film plot (OMDb), used when the description is empty. */
  fallbackDescription?: string | null;
  /** Paid events link to tickets; free events get the FREE tag instead. */
  paid: boolean;
  ticketUrl?: string;
  calendarUrl: string;
};

/** Latest YouTube video or Substack post, only passed when it's from the past week. */
export type WeeklyMedia = {
  title: string;
  url: string;
  imageUrl?: string | null;
};

export interface WeeklyEmailProps {
  /** ISO datetime of the Sunday the week starts on (ET). */
  weekStart: string;
  /** ISO datetime of the Saturday the week ends on (ET). */
  weekEnd: string;
  events: WeeklyEvent[];
  moreEventsUrl: string;
  video?: WeeklyMedia | null;
  post?: WeeklyMedia | null;
}

const TZ = 'America/New_York';

function etParts(iso: string) {
  const d = new Date(iso);
  return {
    dow: d
      .toLocaleDateString('en-US', { timeZone: TZ, weekday: 'short' })
      .toUpperCase(),
    day: d.toLocaleDateString('en-US', { timeZone: TZ, day: 'numeric' }),
    month: d.toLocaleDateString('en-US', { timeZone: TZ, month: 'short' }),
    time: d.toLocaleTimeString('en-US', { timeZone: TZ, timeStyle: 'short' }),
  };
}

/** "Nov 8 – Nov 14", or "Nov 29 – Dec 5" across a month. */
export function weekRangeLabel(weekStart: string, weekEnd: string): string {
  const a = etParts(weekStart);
  const b = etParts(weekEnd);
  return `${a.month} ${a.day} – ${b.month} ${b.day}`;
}

export default function WeeklyEmail({
  weekStart,
  weekEnd,
  events,
  moreEventsUrl,
  video,
  post,
}: WeeklyEmailProps) {
  const range = weekRangeLabel(weekStart, weekEnd);
  const media = [
    video && { label: 'Latest Video', item: video },
    post && { label: 'Latest Post', item: post },
  ].filter(Boolean) as { label: string; item: WeeklyMedia }[];

  return (
    <EmailShell preview={WEEKLY_INTRO}>
      <Img
        src={EMAIL_HEADER_IMAGE_ZVC_URL}
        width="600"
        alt={LLC_NAME}
        style={banner}
      />

      <Section style={introStyle} className="zvc-pad">
        <Text style={kicker}>This week at ZVC</Text>
        <Text style={rangeStyle} className="zvc-title">
          {range}
        </Text>
        <Text style={introText}>{WEEKLY_INTRO}</Text>
      </Section>

      <Section style={listStyle} className="zvc-pad">
        {events.map((ev) => (
          <EventRow key={ev.id} ev={ev} />
        ))}
        <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
          <tr>
            <td style={{ textAlign: 'center', padding: '28px 0 0' }}>
              <Link href={moreEventsUrl} style={moreButton}>
                More Events
              </Link>
            </td>
          </tr>
        </table>
      </Section>

      {media.length > 0 && (
        <Section style={mediaWrap} className="zvc-pad">
          <Section style={mediaDivider}>
            <table
              width="100%"
              cellPadding="0"
              cellSpacing="0"
              role="presentation"
              style={mediaPanel}
            >
              <tr>
                {media.map(({ label, item }, i) => (
                  <td
                    key={label}
                    className="zvc-stack zvc-stack-gap"
                    width={media.length === 2 ? '50%' : '100%'}
                    style={{
                      verticalAlign: 'top',
                      padding:
                        media.length === 2
                          ? i === 0
                            ? '0 8px 0 0'
                            : '0 0 0 8px'
                          : 0,
                    }}
                  >
                    <Link href={item.url} style={mediaLink}>
                      {item.imageUrl && (
                        <Img
                          src={item.imageUrl}
                          width="100%"
                          alt=""
                          style={mediaImage}
                        />
                      )}
                      <Text style={eventType}>{label}</Text>
                      <Text style={mediaTitle}>{item.title}</Text>
                    </Link>
                  </td>
                ))}
              </tr>
            </table>
          </Section>
        </Section>
      )}

      <BrandFooter kind="broadcast">
        <FooterLine>
          You&apos;re receiving this because you subscribed to Zero Vision
          Cinema updates.{' '}
          <FooterLink href={RESEND_UNSUBSCRIBE_URL}>Unsubscribe</FooterLink>
        </FooterLine>
      </BrandFooter>
    </EmailShell>
  );
}

/**
 * One event: a date line, then the poster and the details side by side on
 * desktop. The two columns are inline-blocks with max-widths (220 + 324 = the
 * 544px content width), so they wrap onto separate lines on a phone even in
 * clients that drop the <style> block; where media queries work, the poster
 * then grows to the full column width (see .zvc-week-poster in brand.tsx).
 */
function EventRow({ ev }: { ev: WeeklyEvent }) {
  const { dow, day, time } = etParts(ev.datetime);
  const hasDescription = !richTextIsEmpty(ev.description ?? undefined);

  return (
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      role="presentation"
      style={rowStyle}
    >
      <tr>
        <td style={dateCell}>
          <Text style={dateLine}>
            <span style={dowStyle}>{dow}</span>{' '}
            <span style={dayStyle}>{day}</span>
          </Text>
        </td>
      </tr>
      <tr>
        <td style={columnsCell}>
          {ev.posterUrl && (
            <div className="zvc-week-poster-col" style={posterCol}>
              <Img
                src={ev.posterUrl}
                width={POSTER_WIDTH}
                alt={ev.title}
                className="zvc-week-poster"
                style={posterStyle}
              />
            </div>
          )}
          <div
            className="zvc-week-details"
            style={ev.posterUrl ? detailsCol : detailsColFull}
          >
            <Text style={typeLine}>
              <span style={eventTypeInline}>{ev.typeName}</span>
              {!ev.paid && (
                <>
                  {' '}
                  <span style={freeTag}>FREE</span>
                </>
              )}
            </Text>
            <Text style={eventTitle}>{ev.title}</Text>
            <Text style={whenWhere}>
              {time}
              {ev.venue ? ` · ${ev.venue}` : ''}
            </Text>
            {hasDescription ? (
              <div style={description}>
                <RichText data={ev.description!} />
              </div>
            ) : ev.fallbackDescription ? (
              <Text style={description}>{ev.fallbackDescription}</Text>
            ) : null}
            <Text style={buttonRow}>
              {ev.paid && ev.ticketUrl && (
                <>
                  <Link href={ev.ticketUrl} style={ticketButton}>
                    Get Tickets
                  </Link>{' '}
                </>
              )}
              <Link href={ev.calendarUrl} style={calendarButton}>
                Add to Calendar
              </Link>
            </Text>
          </div>
        </td>
      </tr>
    </table>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const banner: React.CSSProperties = {
  display: 'block',
  width: '100%',
  maxWidth: '600px',
  height: 'auto',
};
const introStyle: React.CSSProperties = { padding: '36px 28px 8px' };
const kicker: React.CSSProperties = {
  fontFamily: LABEL_FONT,
  fontWeight: 700,
  fontSize: '26px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: RETRO_BLUE,
  margin: '0 0 10px',
};
const rangeStyle: React.CSSProperties = {
  fontFamily: HEADLINE_FONT,
  fontWeight: 700,
  fontSize: '48px',
  lineHeight: '1',
  textTransform: 'uppercase',
  color: GLOW,
  margin: '0 0 14px',
};
const introText: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '20px',
  lineHeight: '1.5',
  color: STATIC,
  margin: 0,
};
const listStyle: React.CSSProperties = { padding: '20px 28px 0' };
const rowStyle: React.CSSProperties = { borderTop: `1px solid ${HAIRLINE}` };
/** Desktop poster width; the details column gets the rest of the 544px. */
const POSTER_WIDTH = 220;
const POSTER_GUTTER = 24;
const dateCell: React.CSSProperties = { padding: '26px 0 14px' };
const dateLine: React.CSSProperties = { margin: 0, lineHeight: '1' };
const dowStyle: React.CSSProperties = {
  fontFamily: LABEL_FONT,
  fontWeight: 700,
  fontSize: '14px',
  letterSpacing: '2px',
  color: RETRO_BLUE,
  verticalAlign: 'middle',
};
const dayStyle: React.CSSProperties = {
  fontFamily: HEADLINE_FONT,
  fontWeight: 700,
  fontSize: '34px',
  lineHeight: '1',
  color: GLOW,
  verticalAlign: 'middle',
  paddingLeft: '4px',
};
// font-size 0 removes the whitespace gap between the two inline-block columns.
const columnsCell: React.CSSProperties = { fontSize: 0, paddingBottom: '18px' };
const posterCol: React.CSSProperties = {
  display: 'inline-block',
  verticalAlign: 'top',
  width: '100%',
  maxWidth: `${POSTER_WIDTH + POSTER_GUTTER}px`,
  paddingRight: `${POSTER_GUTTER}px`,
  paddingBottom: '18px',
  boxSizing: 'border-box',
};
const posterStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  maxWidth: `${POSTER_WIDTH}px`,
  height: 'auto',
  border: `1px solid ${HAIRLINE}`,
};
const detailsCol: React.CSSProperties = {
  display: 'inline-block',
  verticalAlign: 'top',
  width: '100%',
  maxWidth: `${CONTENT_WIDTH - POSTER_WIDTH - POSTER_GUTTER}px`,
};
const detailsColFull: React.CSSProperties = {
  display: 'block',
  width: '100%',
};
const eventType: React.CSSProperties = {
  fontFamily: LABEL_FONT,
  fontWeight: 700,
  fontSize: '11px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: RETRO_BLUE,
  margin: '0 0 6px',
};
const typeLine: React.CSSProperties = { ...eventType, margin: '0 0 8px' };
const eventTypeInline: React.CSSProperties = { verticalAlign: 'middle' };
const freeTag: React.CSSProperties = {
  display: 'inline-block',
  verticalAlign: 'middle',
  backgroundColor: CULT_CLASSIC,
  color: GLOW,
  fontSize: '10px',
  letterSpacing: '1.5px',
  lineHeight: '1',
  padding: '4px 8px',
  borderRadius: '999px',
  marginLeft: '4px',
};
const eventTitle: React.CSSProperties = {
  fontFamily: HEADLINE_FONT,
  fontWeight: 700,
  fontSize: '26px',
  lineHeight: '1.05',
  textTransform: 'uppercase',
  color: GLOW,
  margin: '0 0 6px',
};
const whenWhere: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '17px',
  color: STATIC,
  margin: '0 0 6px',
};
const description: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '16px',
  lineHeight: '1.45',
  color: STATIC,
  margin: '0 0 6px',
};
const buttonRow: React.CSSProperties = {
  margin: '12px 0 14px',
  lineHeight: '1',
};
const buttonBase: React.CSSProperties = {
  display: 'inline-block',
  fontFamily: LABEL_FONT,
  fontWeight: 700,
  fontSize: '13px',
  letterSpacing: '1.5px',
  lineHeight: '1',
  textTransform: 'uppercase',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  margin: '0 8px 8px 0',
};
// Blackout on Blue Light: Glow text on this blue is too faint at button size.
const ticketButton: React.CSSProperties = {
  ...buttonBase,
  backgroundColor: BLUE_LIGHT,
  color: BLACKOUT,
  padding: '12px 20px',
  border: `2px solid ${BLUE_LIGHT}`,
};
const calendarButton: React.CSSProperties = {
  ...buttonBase,
  color: GLOW,
  padding: '12px 18px',
  border: `2px solid ${RETRO_BLUE}`,
};
const moreButton: React.CSSProperties = {
  ...calendarButton,
  margin: 0,
  fontSize: '14px',
  padding: '14px 32px',
};
const mediaWrap: React.CSSProperties = { padding: '44px 28px 0' };
const mediaDivider: React.CSSProperties = {
  borderTop: `1px solid ${HAIRLINE}`,
  paddingTop: '44px',
};
const mediaPanel: React.CSSProperties = {
  backgroundColor: PANEL,
  borderRadius: '6px',
  padding: '20px',
};
const mediaLink: React.CSSProperties = {
  color: GLOW,
  textDecoration: 'none',
  display: 'block',
};
const mediaImage: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: 'auto',
  margin: '0 0 10px',
};
const mediaTitle: React.CSSProperties = {
  fontFamily: HEADLINE_FONT,
  fontWeight: 700,
  fontSize: '20px',
  lineHeight: '1.1',
  textTransform: 'uppercase',
  color: GLOW,
  margin: 0,
};
