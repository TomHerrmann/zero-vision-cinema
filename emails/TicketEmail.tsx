import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from '@react-email/components';
import { RichText } from '@payloadcms/richtext-lexical/react';
import { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical';
import {
  AHC_DISCORD_URL,
  PARTIFUL_URL,
  ZVC_INSTAGRAM_URL,
  LLC_NAME,
  ZVC_EMAIL_ADDRESS,
  ZVC_SITE_URL,
  ADDRESS_LINE_1,
  ADDRESS_LINE_2,
  EMAIL_HEADER_IMAGE_ZVC_URL,
} from '@/app/contsants/constants';
import { richTextIsEmpty } from '@/utils/richText';
import type { MovieData } from '@/lib/omdb';

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
}

export default function TicketEmail({
  eventName = 'Zero Event',
  eventImage = 'https://www.zerovisioncinema.com/_next/image?url=https%3A%2F%2Fm.media-amazon.com%2Fimages%2FM%2FMV5BNGMyMGNkMDUtMjc2Ni00NWFlLTgyODEtZTY2MzBiZTg0OWZiXkEyXkFqcGc%40._V1_SX1000.jpg&w=1080&q=75',
  quantity = 1,
  eventDate = new Date().toISOString(),
  eventLocation = 'Zero Vision Cinema',
  eventDescription = {
    root: {
      children: [],
      direction: null,
      format: '',
      indent: 0,
      type: 'paragraph',
      version: 1,
    },
  },
  eventAddress = '123 Main St, Anytown, USA',
  customerName = 'Valued Customer',
  totalAmount = 0,
  purchaseDate = new Date().toISOString(),
  orderNumber = 12345,
  cardBrand = 'Zero Card',
  cardLast4 = '1234',
  currency = 'USD',
  receiptUrl = '#',
  refundUrl = '#',
  movie = {
    title: 'Terminator 2: Judgment Day',
    year: '1991',
    rated: 'R',
    runtime: '137 min',
    genre: 'Action, Sci-Fi',
    director: 'James Cameron',
    actors: 'Arnold Schwarzenegger, Linda Hamilton, Edward Furlong',
    plot: 'A cyborg, identical to the one who failed to kill Sarah Connor, must now protect her ten year old son John from a more advanced and powerful cyborg.',
    imdbRating: '8.6',
    poster: '',
  },
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

  return (
    <Html>
      <Head>
        <style>
          {`
            /* Gmail-specific resets */
            u + .body .gmail-fix { display: none; }
            .gmail-fix { display: block !important; }
            
            /* Force Gmail to respect our styles */
            .gmail-mobile-forced-width { 
              min-width: 600px !important; 
              width: 600px !important; 
            }
            
            /* Gmail font fallbacks */
            .gmail-font-fix {
              font-family: Arial, Helvetica, sans-serif !important;
            }
            
            /* Gmail background color fixes */
            .gmail-bg-fix {
              background-color: #1F1F1F !important;
            }
            
            /* Mobile Gmail specific overrides */
            @media screen and (max-width: 480px) {
              .gmail-mobile-forced-width { 
                min-width: 100% !important; 
                width: 100% !important; 
              }
              
              .gmail-mobile-padding {
                padding: 16px !important;
              }
              
              .gmail-mobile-font-size {
                font-size: 16px !important;
              }
            }
            
            /* Gmail-safe font loading with fallback */
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            /* Reset and base styles for email clients */
            body, table, td, p, a, li, blockquote {
              -webkit-text-size-adjust: 100%;
              -ms-text-size-adjust: 100%;
              font-family: Arial, Helvetica, sans-serif; /* Gmail fallback */
            }
            table, td {
              mso-table-lspace: 0pt;
              mso-table-rspace: 0pt;
            }
            img {
              -ms-interpolation-mode: bicubic;
              border: 0;
              height: auto;
              line-height: 100%;
              outline: none;
              text-decoration: none;
              display: block; /* Force block for Gmail */
            }
            table {
              border-collapse: collapse !important;
            }
            
            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
              .light-only { display: none !important; }
              .dark-bg { background-color: #0a0a0a !important; }
              .dark-text { color: #fafafa !important; }
              .dark-border { border-color: #27272a !important; }
            }
          `}
        </style>
      </Head>
      <Body style={main}>
        <Preview>
          Your {eventName} Ticket{plural}
        </Preview>
        <Container style={outerContainer} className="gmail-mobile-forced-width">
          <table
            width="100%"
            cellPadding="0"
            cellSpacing="0"
            style={container}
            className="gmail-bg-fix"
          >
            <tr>
              <td>
                <div className="gmail-fix">
                  {/* Header */}
                  <table
                    width="100%"
                    cellPadding="0"
                    cellSpacing="0"
                    style={headerSection}
                    className="gmail-bg-fix"
                  >
                    <tr>
                      <td style={headerCell}>
                        <Img
                          src={EMAIL_HEADER_IMAGE_ZVC_URL}
                          width="100%"
                          alt="Zero Vision Cinema Logo"
                          style={headerImage}
                        />
                      </td>
                    </tr>
                  </table>
                </div>

                {/* Main Content */}
                <table
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  style={mainContent}
                  className="gmail-bg-fix"
                >
                  <tr>
                    <td style={contentPadding} className="gmail-mobile-padding">
                      {/* Hero Section */}
                      <table width="100%" cellPadding="0" cellSpacing="0">
                        <tr>
                          <td style={heroSection}>
                            <Heading
                              style={heroTitle}
                              className="gmail-font-fix"
                            >
                              Your {eventName} Ticket{plural}
                            </Heading>

                            {customerName && (
                              <Text
                                style={thankYouText}
                                className="gmail-font-fix"
                              >
                                Thank you for your purchase, {customerName}!
                              </Text>
                            )}

                            <Text
                              style={subtitleText}
                              className="gmail-font-fix"
                            >
                              Please present this ticket for event entry
                            </Text>
                          </td>
                        </tr>
                      </table>

                      {/* Gmail-Safe Ticket Card */}
                      <table
                        width="100%"
                        cellPadding="0"
                        cellSpacing="0"
                        style={gmailMobileTable}
                      >
                        <tr>
                          <td align="center" style={{ padding: '20px 0' }}>
                            <table
                              cellPadding="0"
                              cellSpacing="0"
                              style={gmailTicketCard}
                            >
                              <tr>
                                <td
                                  style={{
                                    padding: '24px 20px',
                                    textAlign: 'center',
                                  }}
                                >
                                  {/* Admits Section - Simplified */}
                                  <table
                                    width="100%"
                                    cellPadding="0"
                                    cellSpacing="0"
                                  >
                                    <tr>
                                      <td
                                        style={{
                                          textAlign: 'center',
                                          borderTop:
                                            '1px solid rgba(255,253,246,0.15)',
                                          paddingTop: '16px',
                                        }}
                                      >
                                        <div style={gmailAdmitLabel}>
                                          ADMITS
                                        </div>
                                        <div style={gmailAdmitNumber}>
                                          {quantity}
                                        </div>
                                      </td>
                                    </tr>
                                  </table>

                                  {/* Event Image - Simplified */}
                                  <table
                                    width="100%"
                                    cellPadding="0"
                                    cellSpacing="0"
                                  >
                                    <tr>
                                      <td
                                        align="center"
                                        style={{ padding: '20px 0' }}
                                      >
                                        {eventImage && (
                                          <img
                                            src={eventImage}
                                            width="200"
                                            height="300"
                                            alt="Event Poster"
                                            style={gmailEventImageStyle}
                                          />
                                        )}
                                      </td>
                                    </tr>
                                  </table>

                                  {/* Date - Simplified */}
                                  <table
                                    width="100%"
                                    cellPadding="0"
                                    cellSpacing="0"
                                  >
                                    <tr>
                                      <td
                                        style={{
                                          textAlign: 'center',
                                          paddingBottom: '20px',
                                          borderBottom:
                                            '1px solid rgba(255,253,246,0.15)',
                                          marginBottom: '20px',
                                        }}
                                      >
                                        <div style={gmailDateText}>
                                          {date
                                            .toLocaleDateString('en-US', {
                                              weekday: 'short',
                                              month: 'short',
                                              day: 'numeric',
                                              timeZone: 'America/New_York',
                                            })
                                            .toUpperCase()}
                                        </div>
                                        <div style={gmailTimeText}>
                                          {date.toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true,
                                            timeZone: 'America/New_York',
                                          })}
                                        </div>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      {/* Quick Details */}
                      <table
                        width="100%"
                        cellPadding="0"
                        cellSpacing="0"
                        style={quickDetails}
                      >
                        <tr>
                          <td style={quickDetailsContent}>
                            <Text
                              style={quickDetailsText}
                              className="gmail-font-fix"
                            >
                              <strong>{eventLocation}</strong> • Doors:{' '}
                              {date.toLocaleTimeString('en-US', {
                                timeStyle: 'short',
                                timeZone: 'America/New_York',
                              })}
                            </Text>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                {/* Event Details Section */}
                <table
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  style={section}
                >
                  <tr>
                    <td style={sectionContent} className="gmail-mobile-padding">
                      <Heading style={sectionTitle} className="gmail-font-fix">
                        Event Details
                      </Heading>

                      <table
                        width="100%"
                        cellPadding="0"
                        cellSpacing="0"
                        style={detailsGrid}
                      >
                        <tr>
                          <td style={detailCard}>
                            <Text
                              style={detailLabel}
                              className="gmail-font-fix"
                            >
                              DATE & TIME
                            </Text>
                            <Text
                              style={detailValue}
                              className="gmail-font-fix"
                            >
                              {date.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                timeZone: 'America/New_York',
                              })}
                            </Text>
                            <Text
                              style={detailValue}
                              className="gmail-font-fix"
                            >
                              {date.toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                                timeZone: 'America/New_York',
                              })}
                            </Text>
                          </td>
                        </tr>
                      </table>

                      <table
                        width="100%"
                        cellPadding="0"
                        cellSpacing="0"
                        style={detailsGrid}
                      >
                        <tr>
                          <td style={detailCard}>
                            <Text
                              style={detailLabel}
                              className="gmail-font-fix"
                            >
                              LOCATION
                            </Text>
                            <Text
                              style={detailValue}
                              className="gmail-font-fix"
                            >
                              {eventLocation}
                            </Text>
                            {eventAddress && (
                              <Text
                                style={detailSubtext}
                                className="gmail-font-fix"
                              >
                                {eventAddress}
                              </Text>
                            )}
                          </td>
                        </tr>
                      </table>

                      {/* About — the event's own description (if any) */}
                      {!descriptionIsEmpty && (
                        <table
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          style={detailsGrid}
                        >
                          <tr>
                            <td style={detailCard}>
                              <Text
                                style={detailLabel}
                                className="gmail-font-fix"
                              >
                                ABOUT
                              </Text>
                              <div
                                style={detailValue}
                                className="gmail-font-fix"
                              >
                                <RichText data={eventDescription!} />
                              </div>
                            </td>
                          </tr>
                        </table>
                      )}

                      {/* OMDB film details — mirrors the event page */}
                      {hasFilmDetails && (
                        <table
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          style={detailsGrid}
                        >
                          <tr>
                            <td style={detailCard}>
                              <table
                                width="100%"
                                cellPadding="0"
                                cellSpacing="0"
                              >
                                <tr>
                                  <td
                                    style={detailLabel}
                                    className="gmail-font-fix"
                                  >
                                    ABOUT THE FILM
                                  </td>
                                  {movie?.imdbRating && (
                                    <td
                                      style={ratingCell}
                                      className="gmail-font-fix"
                                    >
                                      ★ {movie.imdbRating}
                                    </td>
                                  )}
                                </tr>
                              </table>
                              {movie?.plot && (
                                <Text
                                  style={filmPlot}
                                  className="gmail-font-fix"
                                >
                                  {movie.plot}
                                </Text>
                              )}
                              <SpecRow
                                label="Director"
                                value={movie?.director}
                              />
                              <SpecRow label="Year" value={movie?.year} />
                              <SpecRow
                                label="Rated · Runtime"
                                value={[movie?.rated, movie?.runtime]
                                  .filter(Boolean)
                                  .join(' · ')}
                              />
                              <SpecRow label="Genre" value={movie?.genre} />
                            </td>
                          </tr>
                        </table>
                      )}
                    </td>
                  </tr>
                </table>

                {/* Important Information */}
                <table
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  style={section}
                >
                  <tr>
                    <td style={sectionContent} className="gmail-mobile-padding">
                      <Heading style={sectionTitle} className="gmail-font-fix">
                        Important Information
                      </Heading>
                      <table
                        width="100%"
                        cellPadding="0"
                        cellSpacing="0"
                        style={alertBox}
                      >
                        <tr>
                          <td style={alertContent}>
                            <Text style={alertText} className="gmail-font-fix">
                              • Present this email or screenshot for entry
                            </Text>
                            <Text style={alertText} className="gmail-font-fix">
                              • Tickets are non-transferable unless specified
                            </Text>
                            <Text style={alertText} className="gmail-font-fix">
                              • Contact us for accessibility accommodations
                            </Text>
                            <Text style={alertText} className="gmail-font-fix">
                              • Outside food and beverages not permitted
                            </Text>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                {/* Purchase Summary */}
                {(totalAmount || purchaseDateFormatted) && (
                  <table
                    width="100%"
                    cellPadding="0"
                    cellSpacing="0"
                    style={section}
                  >
                    <tr>
                      <td
                        style={sectionContent}
                        className="gmail-mobile-padding"
                      >
                        <Heading
                          style={sectionTitle}
                          className="gmail-font-fix"
                        >
                          Purchase Summary
                        </Heading>
                        <table
                          width="100%"
                          cellPadding="0"
                          cellSpacing="0"
                          style={summaryCard}
                        >
                          <tr>
                            <td style={summaryContent}>
                              {orderNumber && (
                                <table
                                  width="100%"
                                  cellPadding="0"
                                  cellSpacing="0"
                                  style={summaryRow}
                                >
                                  <tr>
                                    <td
                                      style={summaryLabel}
                                      className="gmail-font-fix"
                                    >
                                      Order #
                                    </td>
                                    <td
                                      style={summaryValue}
                                      className="gmail-font-fix"
                                    >
                                      {orderNumber}
                                    </td>
                                  </tr>
                                </table>
                              )}
                              {purchaseDateFormatted && (
                                <table
                                  width="100%"
                                  cellPadding="0"
                                  cellSpacing="0"
                                  style={summaryRow}
                                >
                                  <tr>
                                    <td
                                      style={summaryLabel}
                                      className="gmail-font-fix"
                                    >
                                      Purchase Date
                                    </td>
                                    <td
                                      style={summaryValue}
                                      className="gmail-font-fix"
                                    >
                                      {purchaseDateFormatted}
                                    </td>
                                  </tr>
                                </table>
                              )}
                              <table
                                width="100%"
                                cellPadding="0"
                                cellSpacing="0"
                                style={summaryRow}
                              >
                                <tr>
                                  <td
                                    style={summaryLabel}
                                    className="gmail-font-fix"
                                  >
                                    Event
                                  </td>
                                  <td
                                    style={summaryValue}
                                    className="gmail-font-fix"
                                  >
                                    {eventName}
                                  </td>
                                </tr>
                              </table>
                              <table
                                width="100%"
                                cellPadding="0"
                                cellSpacing="0"
                                style={summaryRow}
                              >
                                <tr>
                                  <td
                                    style={summaryLabel}
                                    className="gmail-font-fix"
                                  >
                                    Quantity
                                  </td>
                                  <td
                                    style={summaryValue}
                                    className="gmail-font-fix"
                                  >
                                    {quantity} ticket{plural}
                                  </td>
                                </tr>
                              </table>
                              {paymentMethod && (
                                <table
                                  width="100%"
                                  cellPadding="0"
                                  cellSpacing="0"
                                  style={summaryRow}
                                >
                                  <tr>
                                    <td
                                      style={summaryLabel}
                                      className="gmail-font-fix"
                                    >
                                      Payment Method
                                    </td>
                                    <td
                                      style={summaryValue}
                                      className="gmail-font-fix"
                                    >
                                      {paymentMethod}
                                    </td>
                                  </tr>
                                </table>
                              )}
                              {totalAmount && (
                                <table
                                  width="100%"
                                  cellPadding="0"
                                  cellSpacing="0"
                                  style={summaryRowTotal}
                                >
                                  <tr>
                                    <td
                                      style={summaryLabelTotal}
                                      className="gmail-font-fix"
                                    >
                                      Total Paid
                                    </td>
                                    <td
                                      style={summaryValueTotal}
                                      className="gmail-font-fix"
                                    >
                                      {`$${totalAmount.toFixed(2)} ${currency}`}
                                    </td>
                                  </tr>
                                </table>
                              )}
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                )}

                {/* Community Links Section */}
                <table
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  style={section}
                >
                  <tr>
                    <td style={sectionContent} className="gmail-mobile-padding">
                      <Heading style={sectionTitle} className="gmail-font-fix">
                        Join the Community
                      </Heading>
                      <Text
                        style={contactDescription}
                        className="gmail-font-fix"
                      >
                        Stay connected and never miss an update!
                      </Text>
                      <table width="100%" cellPadding="0" cellSpacing="0">
                        <tr>
                          <td align="center">
                            <Text
                              style={contactItem}
                              className="gmail-font-fix"
                            >
                              <Link
                                href={ZVC_INSTAGRAM_URL}
                                style={contactLink}
                              >
                                Follow us on Instagram
                              </Link>
                            </Text>
                            <Text
                              style={contactItem}
                              className="gmail-font-fix"
                            >
                              <Link href={PARTIFUL_URL} style={contactLink}>
                                Follow us on Partiful
                              </Link>
                            </Text>
                            <Text
                              style={contactItem}
                              className="gmail-font-fix"
                            >
                              <Link
                                href={`${ZVC_SITE_URL}#newsletter`}
                                style={contactLink}
                              >
                                Join our Mailing List
                              </Link>
                            </Text>
                            <Text
                              style={contactItem}
                              className="gmail-font-fix"
                            >
                              <Link href={AHC_DISCORD_URL} style={contactLink}>
                                Join our Discord
                              </Link>
                            </Text>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                {/* Contact Section */}
                <table
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  style={section}
                >
                  <tr>
                    <td style={sectionContent} className="gmail-mobile-padding">
                      <Heading style={sectionTitle} className="gmail-font-fix">
                        Need Help?
                      </Heading>
                      <Text
                        style={contactDescription}
                        className="gmail-font-fix"
                      >
                        Questions about your tickets or the event? We're here to
                        help.
                      </Text>
                      <table width="100%" cellPadding="0" cellSpacing="0">
                        <tr>
                          <td align="center">
                            <Text
                              style={contactItem}
                              className="gmail-font-fix"
                            >
                              <Link
                                href="mailto:info@zerovisioncinema.com"
                                style={contactLink}
                              >
                                info@zerovisioncinema.com
                              </Link>
                            </Text>
                            <Text
                              style={contactItem}
                              className="gmail-font-fix"
                            >
                              <Link href={ZVC_SITE_URL} style={contactLink}>
                                zerovisioncinema.com
                              </Link>
                            </Text>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                {/* Refund & Cancellation Policy */}
                <table
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  style={policySection}
                >
                  <tr>
                    <td style={policyContent}>
                      <Text style={policyText} className="gmail-font-fix">
                        <strong>Refund &amp; Cancellation Policy:</strong>{' '}
                        Refunds are automatic when requested at least 48 hours
                        before the scheduled event start time. Within 48 hours
                        of the event, email{' '}
                        <Link
                          href={`mailto:${ZVC_EMAIL_ADDRESS}`}
                          style={policyLink}
                        >
                          {ZVC_EMAIL_ADDRESS}
                        </Link>{' '}
                        to request one. Full{' '}
                        <Link href={TERMS_URL} style={policyLink}>
                          Terms of Service
                        </Link>
                        .
                      </Text>
                      {refundUrl && (
                        <table width="100%" cellPadding="0" cellSpacing="0">
                          <tr>
                            <td align="center" style={{ paddingTop: '14px' }}>
                              <Link
                                href={refundUrl}
                                style={refundButton}
                                className="gmail-font-fix"
                              >
                                Request a refund
                              </Link>
                            </td>
                          </tr>
                        </table>
                      )}
                    </td>
                  </tr>
                </table>

                {/* Footer */}
                <table
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  style={footer}
                >
                  <tr>
                    <td style={footerContent}>
                      <Text style={footerText} className="gmail-font-fix">
                        {LLC_NAME}
                      </Text>
                      <Text style={footerText} className="gmail-font-fix">
                        {ADDRESS_LINE_1}, {ADDRESS_LINE_2}
                      </Text>
                      <Text style={footerText} className="gmail-font-fix">
                        Support:{' '}
                        <Link
                          href={`mailto:${ZVC_EMAIL_ADDRESS}`}
                          style={footerLink}
                        >
                          {ZVC_EMAIL_ADDRESS}
                        </Link>
                      </Text>
                      <Text style={footerLinks} className="gmail-font-fix">
                        {receiptUrl && (
                          <>
                            <Link href={receiptUrl} style={footerLink}>
                              View official receipt
                            </Link>
                            {' • '}
                          </>
                        )}
                        <Link href={TERMS_URL} style={footerLink}>
                          Terms of Service
                        </Link>
                        {' • '}
                        <Link href={ZVC_SITE_URL} style={footerLink}>
                          Website
                        </Link>
                      </Text>
                      <Text style={footerText} className="gmail-font-fix">
                        © {new Date().getFullYear()} {LLC_NAME}
                      </Text>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </Container>
      </Body>
    </Html>
  );
}

/** A label/value row for the film-details block (skipped when the value is empty). */
function SpecRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" style={summaryRow}>
      <tr>
        <td style={summaryLabel} className="gmail-font-fix">
          {label}
        </td>
        <td style={summaryValue} className="gmail-font-fix">
          {value}
        </td>
      </tr>
    </table>
  );
}

// Dark "grindhouse" theme to match the refund / broadcast emails. Table
// structure kept for cross-client (Gmail/Outlook) rendering.
const GLOW = '#FFFDF6';
const BLUE = '#4A8CC6';

const main = {
  backgroundColor: '#141414',
  fontFamily: 'Arial, Helvetica, sans-serif',
  margin: '0',
  padding: '0',
  lineHeight: '1.4',
};

const outerContainer = {
  width: '100%',
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#141414',
};

const container = {
  backgroundColor: '#1F1F1F',
  width: '100%',
  maxWidth: '600px',
  margin: '0 auto',
  borderRadius: '0',
  overflow: 'hidden',
  border: '1px solid rgba(255,253,246,0.12)',
};

const headerSection = {
  backgroundColor: '#1F1F1F',
  width: '100%',
};

const headerCell = {
  padding: '0',
};

const headerImage = {
  display: 'block',
  width: '100%',
  maxWidth: '100%',
  height: 'auto',
};

const mainContent = {
  backgroundColor: '#1F1F1F',
  width: '100%',
};

const contentPadding = {
  padding: '32px 24px',
};

const heroSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const heroTitle = {
  color: GLOW,
  fontSize: '24px',
  fontWeight: 'bold',
  lineHeight: '1.2',
  margin: '0 0 16px 0',
  fontFamily: 'Arial, Helvetica, sans-serif',
  textAlign: 'center' as const,
  letterSpacing: '-0.025em',
};

const thankYouText = {
  color: BLUE,
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 12px 0',
  lineHeight: '24px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const subtitleText = {
  color: 'rgba(255,253,246,0.6)',
  fontSize: '16px',
  fontWeight: '400',
  lineHeight: '24px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

// Gmail-safe table styles
const gmailMobileTable = {
  width: '100%',
  minWidth: '100%',
  maxWidth: '600px',
  tableLayout: 'fixed' as const,
  marginBottom: '24px',
};

const gmailTicketCard = {
  backgroundColor: '#262626',
  border: '2px solid #4A8CC6',
  borderRadius: '0',
  width: '100%',
  maxWidth: '320px',
  margin: '0 auto',
};

const gmailDateText = {
  color: GLOW,
  fontSize: '14px',
  fontWeight: 'bold',
  marginBottom: '4px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const gmailTimeText = {
  color: 'rgba(255,253,246,0.6)',
  fontSize: '13px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const gmailEventImageStyle = {
  display: 'block',
  maxWidth: '100%',
  height: 'auto',
  border: '1px solid rgba(255,253,246,0.2)',
  margin: '0 auto',
  width: '200px',
};

const gmailAdmitLabel = {
  color: BLUE,
  fontSize: '11px',
  fontWeight: 'bold',
  marginBottom: '4px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const gmailAdmitNumber = {
  color: GLOW,
  fontSize: '28px',
  fontWeight: 'bold',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const quickDetails = {
  backgroundColor: '#262626',
  borderRadius: '0',
  width: '100%',
};

const quickDetailsContent = {
  padding: '16px',
  textAlign: 'center' as const,
};

const quickDetailsText = {
  color: 'rgba(255,253,246,0.85)',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
  lineHeight: '20px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const section = {
  backgroundColor: '#1F1F1F',
  width: '100%',
  marginTop: '2px',
};

const sectionContent = {
  padding: '32px 24px',
  backgroundColor: '#1F1F1F',
};

const sectionTitle = {
  color: GLOW,
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '0 0 20px 0',
  lineHeight: '24px',
  letterSpacing: '-0.025em',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const detailsGrid = {
  width: '100%',
  marginBottom: '16px',
};

const detailCard = {
  backgroundColor: '#262626',
  border: '1px solid rgba(255,253,246,0.12)',
  borderRadius: '0',
  padding: '16px',
  marginBottom: '8px',
};

const detailLabel = {
  color: BLUE,
  fontSize: '11px',
  fontWeight: 'bold',
  letterSpacing: '0.1em',
  margin: '0',
  lineHeight: '16px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const ratingCell = {
  color: BLUE,
  fontSize: '13px',
  fontWeight: 'bold',
  textAlign: 'right' as const,
  whiteSpace: 'nowrap' as const,
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const filmPlot = {
  color: 'rgba(255,253,246,0.8)',
  fontSize: '13px',
  fontWeight: '400',
  lineHeight: '20px',
  margin: '10px 0 14px 0',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const detailValue = {
  color: 'rgba(255,253,246,0.9)',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 4px 0',
  lineHeight: '20px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const detailSubtext = {
  color: 'rgba(255,253,246,0.6)',
  fontSize: '13px',
  fontWeight: '400',
  margin: '0',
  lineHeight: '18px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const alertBox = {
  backgroundColor: '#22303a',
  border: '1px solid #4A8CC6',
  borderRadius: '0',
  width: '100%',
};

const alertContent = {
  padding: '16px',
};

const alertText = {
  color: 'rgba(255,253,246,0.85)',
  fontSize: '14px',
  fontWeight: '400',
  margin: '0 0 8px 0',
  lineHeight: '20px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const summaryCard = {
  backgroundColor: '#262626',
  border: '1px solid rgba(255,253,246,0.12)',
  borderRadius: '0',
  width: '100%',
};

const summaryContent = {
  padding: '16px',
};

const summaryRow = {
  width: '100%',
  marginBottom: '8px',
};

const summaryRowTotal = {
  width: '100%',
  marginTop: '8px',
  paddingTop: '8px',
  borderTop: '1px solid rgba(255,253,246,0.15)',
};

const summaryLabel = {
  color: 'rgba(255,253,246,0.6)',
  fontSize: '14px',
  fontWeight: '400',
  padding: '0 8px 0 0',
  width: '40%',
  verticalAlign: 'top' as const,
  lineHeight: '20px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const summaryValue = {
  color: GLOW,
  fontSize: '14px',
  fontWeight: '500',
  textAlign: 'right' as const,
  verticalAlign: 'top' as const,
  lineHeight: '20px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const summaryLabelTotal = {
  ...summaryLabel,
  color: 'rgba(255,253,246,0.85)',
  fontWeight: 'bold',
};

const summaryValueTotal = {
  ...summaryValue,
  fontWeight: 'bold',
  color: BLUE,
};

const contactDescription = {
  color: 'rgba(255,253,246,0.6)',
  fontSize: '14px',
  fontWeight: '400',
  textAlign: 'center' as const,
  margin: '0 0 16px 0',
  lineHeight: '20px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const contactItem = {
  color: 'rgba(255,253,246,0.75)',
  fontSize: '14px',
  fontWeight: '400',
  margin: '0 0 8px 0',
  lineHeight: '20px',
  textAlign: 'center' as const,
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const contactLink = {
  color: BLUE,
  textDecoration: 'none',
  fontWeight: '500',
};

const policySection = {
  backgroundColor: '#1F1F1F',
  width: '100%',
  marginTop: '2px',
};

const policyContent = {
  padding: '24px',
  backgroundColor: '#141414',
};

const policyText = {
  color: 'rgba(255,253,246,0.55)',
  fontSize: '12px',
  fontWeight: '400',
  margin: '0',
  lineHeight: '18px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const policyLink = {
  color: BLUE,
  textDecoration: 'underline',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const refundButton = {
  display: 'inline-block',
  border: '1px solid rgba(255,253,246,0.3)',
  color: 'rgba(255,253,246,0.75)',
  fontSize: '12px',
  fontWeight: '600',
  textDecoration: 'none',
  padding: '8px 16px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const footer = {
  backgroundColor: '#09090b',
  width: '100%',
};

const footerContent = {
  padding: '24px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#a1a1aa',
  fontSize: '12px',
  fontWeight: '400',
  margin: '0 0 4px 0',
  lineHeight: '16px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const footerLinks = {
  color: '#a1a1aa',
  fontSize: '12px',
  fontWeight: '400',
  margin: '8px 0 0 0',
  lineHeight: '16px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const footerLink = {
  color: '#d4d4d8',
  textDecoration: 'none',
  fontWeight: '400',
};
