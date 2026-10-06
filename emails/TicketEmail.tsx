import { Img, Link, Section, Text } from '@react-email/components';
import { RichText } from '@payloadcms/richtext-lexical/react';
import { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import {
  AHC_DISCORD_URL,
  PARTIFUL_URL,
  ZVC_INSTAGRAM_URL,
  LLC_NAME,
  ZVC_EMAIL_ADDRESS,
  ZVC_SITE_URL,
} from '@/app/contsants/constants';
import { richTextIsEmpty } from '@/utils/richText';
import type { MovieData } from '@/lib/omdb';
import type { LoyaltyNotice } from '@/lib/loyalty';
import LoyaltyProgress from './components/LoyaltyProgress';
import {
  BLACKOUT,
  BODY_FONT,
  BrandFooter,
  BrandHeader,
  CULT_CLASSIC,
  EmailShell,
  FooterLine,
  FooterLink,
  GLOW,
  HAIRLINE,
  HEADLINE_FONT,
  INK_SOFT,
  Kicker,
  LABEL_FONT,
  Label,
  OutlineButton,
  RETRO_BLUE,
  Row,
  STATIC,
  SectionTitle,
  Title,
  bodyTextStyle,
  contentStyle,
  linkStyle,
  mutedTextStyle,
  panelStyle,
} from './components/brand';

const TERMS_URL = `${ZVC_SITE_URL}/terms`;

interface Props {
  eventName: string;
  eventImage?: string;
  eventDate: string;
  eventLocation: string;
  eventDescription?: SerializedEditorState;
  eventAddress: string;
  quantity: number;
  customerName?: string;
  totalAmount: number;
  purchaseDate: string;
  /** Receipt fields — resolved from Stripe at send time, never stored by us. */
  orderNumber?: number;
  cardBrand?: string;
  cardLast4?: string;
  currency?: string;
  /** Stripe-hosted receipt URL. */
  receiptUrl?: string;
  /** Signed refund-request page URL (order prefilled). */
  refundUrl?: string;
  /**
   * OMDB film data when the event has an IMDb id. Pass `null` (not undefined) to
   * render no film details — undefined lets the preview default apply.
   */
  movie?: MovieData | null;
  /** Free-ticket reward status (progress, earned, or this is the free ticket). */
  loyalty?: LoyaltyNotice | null;
}

/**
 * Ticket + receipt. The Glow "paper ticket" up top is what's shown at the door;
 * everything below it is the receipt.
 */
export default function TicketEmail({
  eventName,
  eventImage,
  quantity,
  eventDate,
  eventLocation,
  eventDescription,
  eventAddress,
  customerName,
  totalAmount,
  purchaseDate,
  orderNumber,
  cardBrand,
  cardLast4,
  currency,
  receiptUrl,
  refundUrl,
  movie,
  loyalty,
}: Props) {
  const date = new Date(eventDate);
  const plural = quantity > 1 ? 's' : '';
  const purchaseDateFormatted = purchaseDate
    ? new Date(purchaseDate).toLocaleDateString('en-US')
    : null;
  const paymentMethod =
    cardBrand && cardLast4 ? `${cardBrand} ending in ${cardLast4}` : null;
  const descriptionIsEmpty = richTextIsEmpty(eventDescription);
  const hasFilmDetails = Boolean(movie && (movie.director || movie.plot));
  const dayLabel = date
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'America/New_York',
    })
    .toUpperCase();
  const timeLabel = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  });

  return (
    <EmailShell preview={`Your ${eventName} Ticket${plural}`}>
      <BrandHeader />

      {/* Hero */}
      <Section style={{ ...contentStyle, textAlign: 'center' }} className="zvc-pad">
        <Kicker align="center">Your Ticket{plural}</Kicker>
        <Title align="center">{eventName}</Title>
        {customerName && (
          <Text style={{ ...bodyTextStyle, fontSize: '20px', margin: '0 0 6px' }}>
            Thank you for your purchase, {customerName}!
          </Text>
        )}
        <Text style={{ ...mutedTextStyle, fontStyle: 'italic', margin: 0 }}>
          Please present this ticket for event entry
        </Text>
      </Section>

      {/* The ticket */}
      <Section style={{ padding: '28px 28px 0' }} className="zvc-pad">
        <table
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          role="presentation"
          className="zvc-ticket"
          style={ticketCard}
        >
          <tr>
            <td style={{ padding: '24px 24px 20px' }}>
              <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
                <tr>
                  {eventImage && (
                    <td
                      width="150"
                      className="zvc-stack zvc-stack-gap"
                      style={{ width: '150px', verticalAlign: 'top', paddingRight: '22px' }}
                    >
                      <Img
                        src={eventImage}
                        width="150"
                        alt="Event Poster"
                        className="zvc-poster"
                        style={posterStyle}
                      />
                    </td>
                  )}
                  <td className="zvc-stack" style={{ verticalAlign: 'top' }}>
                    <table cellPadding="0" cellSpacing="0" role="presentation">
                      <tr>
                        <td className="zvc-admit" style={admitNumber}>
                          {quantity}
                        </td>
                        <td className="zvc-admit" style={admitLabel}>
                          ADMITS
                        </td>
                      </tr>
                    </table>
                    <div style={ticketRule} />
                    <Text className="zvc-ticket-ink" style={ticketDay}>
                      {dayLabel}
                    </Text>
                    <Text className="zvc-ticket-ink" style={ticketTime}>
                      {timeLabel}
                    </Text>
                    <Text className="zvc-ticket-ink" style={ticketVenue}>
                      {eventLocation}
                    </Text>
                    {eventAddress && (
                      <Text className="zvc-ticket-ink" style={ticketAddress}>
                        {eventAddress}
                      </Text>
                    )}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          {(orderNumber || customerName) && (
            <tr>
              <td style={stubCell}>
                <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
                  <tr>
                    <td className="zvc-ticket-ink" style={stubText}>
                      {orderNumber ? `Order # ${orderNumber}` : ''}
                    </td>
                    <td
                      className="zvc-ticket-ink"
                      style={{ ...stubText, textAlign: 'right' }}
                    >
                      {customerName ?? ''}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          )}
        </table>
      </Section>

      <Section style={contentStyle} className="zvc-pad">
        {loyalty && <LoyaltyProgress notice={loyalty} />}

        {/* About — the event's own description */}
        {!descriptionIsEmpty && (
          <>
            <Label>ABOUT</Label>
            <div style={richTextWrap}>
              <RichText data={eventDescription!} />
            </div>
          </>
        )}

        {/* OMDB film details — mirrors the event page */}
        {hasFilmDetails && (
          <Section style={panelStyle}>
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
              <tr>
                <td style={panelLabel}>ABOUT THE FILM</td>
                {movie?.imdbRating && (
                  <td style={ratingCell}>★ {movie.imdbRating}</td>
                )}
              </tr>
            </table>
            {movie?.plot && <Text style={filmPlot}>{movie.plot}</Text>}
            <Row label="Director" value={movie?.director} />
            <Row label="Year" value={movie?.year} />
            <Row
              label="Rated · Runtime"
              value={[movie?.rated, movie?.runtime].filter(Boolean).join(' · ')}
            />
            <Row label="Genre" value={movie?.genre} last />
          </Section>
        )}

        {/* Important Information */}
        <Section style={{ margin: '16px 0 0' }}>
          <SectionTitle>Important Information</SectionTitle>
          <ul style={infoList}>
            <li style={infoItem}>Present this email or screenshot for entry</li>
            <li style={infoItem}>Tickets are non-transferable unless specified</li>
            <li style={infoItem}>Contact us for accessibility accommodations</li>
            <li style={infoItem}>Outside food and beverages not permitted</li>
          </ul>
        </Section>

        {/* Purchase Summary */}
        {(totalAmount || purchaseDateFormatted) && (
          <Section style={{ margin: '20px 0 0' }}>
            <SectionTitle>Purchase Summary</SectionTitle>
            {orderNumber && <Row label="Order #" value={`${orderNumber}`} />}
            <Row label="Purchase Date" value={purchaseDateFormatted} />
            <Row label="Event" value={eventName} />
            <Row label="Quantity" value={`${quantity} ticket${plural}`} />
            <Row label="Payment Method" value={paymentMethod} />
            {totalAmount != null && (
              <Row
                label="Total Paid"
                value={
                  totalAmount > 0
                    ? `$${totalAmount.toFixed(2)} ${(currency ?? 'USD').toUpperCase()}`
                    : 'Free'
                }
                emphasize
              />
            )}
            {receiptUrl && (
              <Text style={{ ...mutedTextStyle, margin: '8px 0 0' }}>
                <Link href={receiptUrl} style={linkStyle}>
                  View official receipt
                </Link>
              </Text>
            )}
          </Section>
        )}

        {/* Refund & Cancellation Policy */}
        <Section style={{ ...panelStyle, margin: '28px 0 0' }}>
          <Text style={policyText}>
            <strong>Refund &amp; Cancellation Policy:</strong> Refunds are
            automatic when requested at least 48 hours before the scheduled event
            start time. Within 48 hours of the event, email{' '}
            <Link href={`mailto:${ZVC_EMAIL_ADDRESS}`} style={linkStyle}>
              {ZVC_EMAIL_ADDRESS}
            </Link>{' '}
            to request one. Full{' '}
            <Link href={TERMS_URL} style={linkStyle}>
              Terms of Service
            </Link>
            .
          </Text>
          {refundUrl && (
            <div style={{ paddingTop: '16px' }}>
              <OutlineButton href={refundUrl}>Request a refund</OutlineButton>
            </div>
          )}
        </Section>

        {/* Community + Help */}
        <table
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          role="presentation"
          style={{ marginTop: '40px' }}
        >
          <tr>
            <td
              width="50%"
              className="zvc-stack zvc-stack-gap"
              style={{ width: '50%', verticalAlign: 'top', paddingRight: '16px' }}
            >
              <h2 style={smallHeading}>Join the Community</h2>
              <Text style={mutedTextStyle}>Stay connected and never miss an update!</Text>
              <Text style={linkList}>
                <Link href={ZVC_INSTAGRAM_URL} style={linkStyle}>
                  Follow us on Instagram
                </Link>
                <br />
                <Link href={PARTIFUL_URL} style={linkStyle}>
                  Follow us on Partiful
                </Link>
                <br />
                <Link href={`${ZVC_SITE_URL}#newsletter`} style={linkStyle}>
                  Join our Mailing List
                </Link>
                <br />
                <Link href={AHC_DISCORD_URL} style={linkStyle}>
                  Join our Discord
                </Link>
              </Text>
            </td>
            <td
              width="50%"
              className="zvc-stack"
              style={{ width: '50%', verticalAlign: 'top', paddingLeft: '16px' }}
            >
              <h2 style={smallHeading}>Need Help?</h2>
              <Text style={mutedTextStyle}>
                Questions about your tickets or the event? We&apos;re here to help.
              </Text>
              <Text style={linkList}>
                <Link href="mailto:info@zerovisioncinema.com" style={linkStyle}>
                  info@zerovisioncinema.com
                </Link>
                <br />
                <Link href={ZVC_SITE_URL} style={linkStyle}>
                  zerovisioncinema.com
                </Link>
              </Text>
            </td>
          </tr>
        </table>
      </Section>

      <BrandFooter>
        <FooterLine>
          Support:{' '}
          <FooterLink href={`mailto:${ZVC_EMAIL_ADDRESS}`}>
            {ZVC_EMAIL_ADDRESS}
          </FooterLink>
        </FooterLine>
        <FooterLine>
          {receiptUrl && (
            <>
              <FooterLink href={receiptUrl}>View official receipt</FooterLink>
              {' • '}
            </>
          )}
          <FooterLink href={TERMS_URL}>Terms of Service</FooterLink>
          {' • '}
          <FooterLink href={ZVC_SITE_URL}>Website</FooterLink>
        </FooterLine>
        <FooterLine>
          © {new Date().getFullYear()} {LLC_NAME}
        </FooterLine>
      </BrandFooter>
    </EmailShell>
  );
}

// The ticket is the one light surface: Glow card, Blackout ink, Cult Classic
// admit count. Corners square off in Windows Outlook, which is fine.
const ticketCard: React.CSSProperties = {
  backgroundColor: GLOW,
  borderRadius: '6px',
  borderCollapse: 'separate',
};
const posterStyle: React.CSSProperties = {
  display: 'block',
  width: '150px',
  height: 'auto',
  borderRadius: '2px',
};
const admitNumber: React.CSSProperties = {
  fontFamily: HEADLINE_FONT,
  fontWeight: 700,
  letterSpacing: '0.05em',
  fontSize: '72px',
  lineHeight: '64px',
  color: CULT_CLASSIC,
  paddingRight: '10px',
  verticalAlign: 'bottom',
};
const admitLabel: React.CSSProperties = {
  fontFamily: LABEL_FONT,
  fontWeight: 700,
  fontSize: '13px',
  letterSpacing: '2px',
  color: CULT_CLASSIC,
  verticalAlign: 'bottom',
  paddingBottom: '4px',
};
const ticketRule: React.CSSProperties = {
  borderTop: `1px solid ${STATIC}`,
  margin: '14px 0',
  fontSize: '1px',
  lineHeight: '1px',
};
const ticketDay: React.CSSProperties = {
  fontFamily: HEADLINE_FONT,
  fontWeight: 700,
  letterSpacing: '0.05em',
  fontSize: '30px',
  lineHeight: '1',
  color: BLACKOUT,
  margin: '0 0 4px',
};
const ticketTime: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '19px',
  color: BLACKOUT,
  margin: '0 0 14px',
};
const ticketVenue: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '19px',
  fontWeight: 700,
  color: BLACKOUT,
  margin: 0,
};
const ticketAddress: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '16px',
  color: INK_SOFT,
  margin: '2px 0 0',
};
/** The perforation: a dashed rule between the ticket and its stub. */
const stubCell: React.CSSProperties = {
  borderTop: `2px dashed ${STATIC}`,
  padding: '14px 24px 16px',
};
const stubText: React.CSSProperties = {
  fontFamily: LABEL_FONT,
  fontWeight: 700,
  fontSize: '13px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: BLACKOUT,
};
const richTextWrap: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '18px',
  lineHeight: '1.55',
  color: GLOW,
  margin: '0 0 24px',
};
const panelLabel: React.CSSProperties = {
  fontFamily: LABEL_FONT,
  fontWeight: 700,
  fontSize: '12px',
  letterSpacing: '2px',
  color: RETRO_BLUE,
  paddingBottom: '8px',
};
const ratingCell: React.CSSProperties = {
  ...panelLabel,
  textAlign: 'right',
  whiteSpace: 'nowrap',
};
const filmPlot: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontStyle: 'italic',
  fontSize: '17px',
  lineHeight: '1.5',
  color: GLOW,
  margin: '0 0 8px',
  paddingBottom: '8px',
  borderBottom: `1px solid ${HAIRLINE}`,
};
const infoList: React.CSSProperties = {
  margin: '0 0 8px',
  paddingLeft: '22px',
  fontFamily: BODY_FONT,
  fontSize: '17px',
  lineHeight: '1.6',
  color: GLOW,
};
const infoItem: React.CSSProperties = { margin: '0 0 4px' };
const policyText: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '15px',
  lineHeight: '1.55',
  color: STATIC,
  margin: 0,
};
const smallHeading: React.CSSProperties = {
  fontFamily: HEADLINE_FONT,
  fontWeight: 700,
  letterSpacing: '0.05em',
  fontSize: '24px',
  lineHeight: '1.1',
  textTransform: 'uppercase',
  color: GLOW,
  margin: '0 0 8px',
};
const linkList: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '17px',
  lineHeight: '1.7',
  margin: 0,
};
