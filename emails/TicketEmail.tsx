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

interface Props {
  eventName: string;
  eventImage: string;
  eventDate: string;
  eventLocation: string;
  eventDescription: SerializedEditorState;
  eventAddress: string;
  quantity: number;
  customerName?: string;
  totalAmount: number;
  purchaseDate: string;
}

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
}: Props) {
  console.log('** EMAIL PROPS **', {
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
  });
  const date = new Date(eventDate);
  const plural = quantity > 1 ? 's' : '';
  const purchaseDateFormatted = purchaseDate
    ? new Date(purchaseDate).toLocaleDateString('en-US')
    : null;

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
              background-color: #ffffff !important;
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
                          src="https://s7qtxjaxzhtgrxvy.public.blob.vercel-storage.com/zvc_email_header.png"
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
                                          borderBottom: '1px solid #cccccc',
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
                                        <img
                                          src={eventImage}
                                          width="200"
                                          height="300"
                                          alt="Event Poster"
                                          style={gmailEventImageStyle}
                                        />
                                      </td>
                                    </tr>
                                  </table>

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
                                          borderTop: '1px solid #cccccc',
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

                      {eventDescription && (
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
                              <Text
                                style={detailValue}
                                className="gmail-font-fix"
                              >
                                <RichText data={eventDescription} />
                              </Text>
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
                                      ${totalAmount.toFixed(2)}
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
                              <Link
                                href="https://www.zerovisioncinema.com"
                                style={contactLink}
                              >
                                zerovisioncinema.com
                              </Link>
                            </Text>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                {/* Cancellation Policy */}
                <table
                  width="100%"
                  cellPadding="0"
                  cellSpacing="0"
                  style={policySection}
                >
                  <tr>
                    <td style={policyContent}>
                      <Text style={policyText} className="gmail-font-fix">
                        <strong>Cancellation Policy:</strong> Zero Vision Cinema
                        will provide a refund if you cancel at least 48 hours
                        before the scheduled event time. Cancellations made less
                        than 48 hours in advance are not eligible for a refund.
                      </Text>
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
                        © 2025 Zero Vision Cinema LLC
                      </Text>
                      <Text style={footerText} className="gmail-font-fix">
                        418 Broadway Ste N, Albany, NY 12207
                      </Text>
                      <Text style={footerLinks} className="gmail-font-fix">
                        <Link
                          href="mailto:info@zerovisioncinema.com"
                          style={footerLink}
                        >
                          Email Us
                        </Link>
                        {' • '}
                        <Link
                          href="https://www.zerovisioncinema.com"
                          style={footerLink}
                        >
                          Website
                        </Link>
                        {' • '}
                        <Link
                          href="https://dashboard.mailerlite.com/forms/1563255/156426258501076293/share"
                          style={footerLink}
                        >
                          Mailing List
                        </Link>
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

// Gmail-compatible styles - removed border-radius and simplified fonts
const main = {
  backgroundColor: '#fafafa',
  fontFamily: 'Arial, Helvetica, sans-serif', // Simplified for Gmail
  margin: '0',
  padding: '0',
  lineHeight: '1.4', // Add explicit line height
};

const outerContainer = {
  width: '100%',
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#fafafa',
};

const container = {
  backgroundColor: '#ffffff',
  width: '100%',
  maxWidth: '600px',
  margin: '0 auto',
  borderRadius: '0', // Remove for Gmail
  overflow: 'hidden',
  border: '1px solid #e4e4e7',
};

const headerSection = {
  backgroundColor: '#ffffff',
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
  backgroundColor: '#ffffff',
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
  color: '#09090b',
  fontSize: '24px', // Reduced from 28px for mobile Gmail
  fontWeight: 'bold', // Use 'bold' instead of '700'
  lineHeight: '1.2', // Simplified line height
  margin: '0 0 16px 0',
  fontFamily: 'Arial, Helvetica, sans-serif',
  textAlign: 'center' as const,
  letterSpacing: '-0.025em',
};

const thankYouText = {
  color: '#6366f1',
  fontSize: '16px',
  fontWeight: '500',
  margin: '0 0 12px 0',
  lineHeight: '24px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const subtitleText = {
  color: '#71717a',
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
  backgroundColor: '#f5f5f5',
  border: '2px solid #cccccc',
  borderRadius: '0', // No rounded corners for Gmail
  width: '100%', // Full width for mobile
  maxWidth: '320px',
  margin: '0 auto',
};

const gmailDateText = {
  color: '#000000',
  fontSize: '14px',
  fontWeight: 'bold',
  marginBottom: '4px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const gmailTimeText = {
  color: '#666666',
  fontSize: '13px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const gmailEventImageStyle = {
  display: 'block',
  maxWidth: '100%',
  height: 'auto',
  border: '1px solid #cccccc',
  margin: '0 auto',
  width: '200px', // Explicit width for Gmail
};

const gmailAdmitLabel = {
  color: '#666666',
  fontSize: '11px',
  fontWeight: 'bold',
  marginBottom: '4px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const gmailAdmitNumber = {
  color: '#000000',
  fontSize: '28px',
  fontWeight: 'bold',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const quickDetails = {
  backgroundColor: '#f4f4f5',
  borderRadius: '0', // Remove for Gmail
  width: '100%',
};

const quickDetailsContent = {
  padding: '16px',
  textAlign: 'center' as const,
};

const quickDetailsText = {
  color: '#52525b',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
  lineHeight: '20px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const section = {
  backgroundColor: '#fafafa',
  width: '100%',
  marginTop: '2px',
};

const sectionContent = {
  padding: '32px 24px',
  backgroundColor: '#ffffff',
};

const sectionTitle = {
  color: '#09090b',
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
  backgroundColor: '#f5f5f5', // Lighter gray works better in Gmail
  border: '1px solid #cccccc',
  borderRadius: '0', // Remove border radius
  padding: '16px',
  marginBottom: '8px',
};

const detailLabel = {
  color: '#71717a',
  fontSize: '11px',
  fontWeight: 'bold',
  letterSpacing: '0.1em',
  margin: '0',
  lineHeight: '16px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const detailValue = {
  color: '#09090b',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 4px 0',
  lineHeight: '20px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const detailSubtext = {
  color: '#71717a',
  fontSize: '13px',
  fontWeight: '400',
  margin: '0',
  lineHeight: '18px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const alertBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #f59e0b',
  borderRadius: '0', // Remove for Gmail
  width: '100%',
};

const alertContent = {
  padding: '16px',
};

const alertText = {
  color: '#92400e',
  fontSize: '14px',
  fontWeight: '400',
  margin: '0 0 8px 0',
  lineHeight: '20px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const summaryCard = {
  backgroundColor: '#f5f5f5',
  border: '1px solid #cccccc',
  borderRadius: '0', // Remove for Gmail
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
  borderTop: '1px solid #cccccc',
};

const summaryLabel = {
  color: '#71717a',
  fontSize: '14px',
  fontWeight: '400',
  padding: '0 8px 0 0',
  width: '40%',
  verticalAlign: 'top' as const,
  lineHeight: '20px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const summaryValue = {
  color: '#09090b',
  fontSize: '14px',
  fontWeight: '500',
  textAlign: 'right' as const,
  verticalAlign: 'top' as const,
  lineHeight: '20px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const summaryLabelTotal = {
  ...summaryLabel,
  fontWeight: 'bold',
};

const summaryValueTotal = {
  ...summaryValue,
  fontWeight: 'bold',
  color: '#09090b',
};

const contactDescription = {
  color: '#71717a',
  fontSize: '14px',
  fontWeight: '400',
  textAlign: 'center' as const,
  margin: '0 0 16px 0',
  lineHeight: '20px',
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const contactItem = {
  color: '#52525b',
  fontSize: '14px',
  fontWeight: '400',
  margin: '0 0 8px 0',
  lineHeight: '20px',
  textAlign: 'center' as const,
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const contactLink = {
  color: '#6366f1',
  textDecoration: 'none',
  fontWeight: '500',
};

const policySection = {
  backgroundColor: '#fafafa',
  width: '100%',
  marginTop: '2px',
};

const policyContent = {
  padding: '24px',
  backgroundColor: '#f9fafb',
};

const policyText = {
  color: '#374151',
  fontSize: '12px',
  fontWeight: '400',
  margin: '0',
  lineHeight: '18px',
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
