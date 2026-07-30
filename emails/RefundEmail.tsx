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
import {
  LLC_NAME,
  ZVC_EMAIL_ADDRESS,
  ZVC_SITE_URL,
  ADDRESS_LINE_1,
  ADDRESS_LINE_2,
  EMAIL_HEADER_IMAGE_ZVC_URL,
} from '@/app/contsants/constants';

const HEADER_IMAGE = EMAIL_HEADER_IMAGE_ZVC_URL;
const TERMS_URL = `${ZVC_SITE_URL}/terms`;

interface Props {
  eventName: string;
  /** ISO datetime of the event. */
  eventDate: string;
  orderNumber: number;
  refundAmount: number;
  currency?: string;
  cardBrand?: string;
  cardLast4?: string;
  /** ISO datetime the refund was processed. */
  refundDate: string;
  /** Stripe-hosted receipt URL (reflects the refund). */
  receiptUrl?: string;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

export default function RefundEmail({
  eventName,
  orderNumber,
  refundAmount,
  currency,
  cardBrand,
  cardLast4,
  refundDate,
  receiptUrl,
}: Props) {
  const refundedTo =
    cardBrand && cardLast4 ? `${cardBrand} ending in ${cardLast4}` : null;

  return (
    <Html>
      <Head />
      <Preview>Your refund for {eventName} has been processed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={HEADER_IMAGE}
            width="100%"
            alt="Zero Vision Cinema"
            style={header}
          />
          <Section style={content}>
            <Text style={kicker}>Refund processed</Text>
            <Heading style={heading}>You&apos;ve been refunded</Heading>
            <Text style={blurb}>
              Your refund for <strong>{eventName}</strong> has been processed.
              The ticket for this order has been invalidated and is no longer
              valid for entry. Refunds typically take 5–10 business days to
              appear, depending on your bank.
            </Text>

            {/* Transaction details */}
            <Section style={card}>
              <Row label="Order #" value={`${orderNumber}`} />
              <Row label="Event" value={eventName} />
              <Row label="Refund date" value={fmtDate(refundDate)} />
              {refundedTo && <Row label="Refunded to" value={refundedTo} />}
              <Row
                label="Refund total"
                value={`$${refundAmount.toFixed(2)} ${currency}`}
                emphasize
              />
            </Section>

            {receiptUrl && (
              <Text style={smallLine}>
                <Link href={receiptUrl} style={link}>
                  View official receipt
                </Link>
              </Text>
            )}

            <Text style={policy}>
              <strong>Refund &amp; Cancellation Policy:</strong> Refunds are
              automatic when requested at least 48 hours before an event&apos;s
              start time. Within 48 hours, email{' '}
              <Link href={`mailto:${ZVC_EMAIL_ADDRESS}`} style={link}>
                {ZVC_EMAIL_ADDRESS}
              </Link>
              . Full{' '}
              <Link href={TERMS_URL} style={link}>
                Terms of Service
              </Link>
              .
            </Text>
          </Section>

          {/* Compliant footer */}
          <Section style={footer}>
            <Text style={footerName}>{LLC_NAME}</Text>
            <Text style={footerText}>
              {ADDRESS_LINE_1}, {ADDRESS_LINE_2}
            </Text>
            <Text style={footerText}>
              Support:{' '}
              <Link href={`mailto:${ZVC_EMAIL_ADDRESS}`} style={footerLink}>
                {ZVC_EMAIL_ADDRESS}
              </Link>
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} {LLC_NAME}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      style={{ borderBottom: '1px solid rgba(255,253,246,0.1)' }}
    >
      <tr>
        <td style={rowLabel}>{label}</td>
        <td style={emphasize ? rowValueEmphasis : rowValue}>{value}</td>
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
  fontSize: '28px',
  lineHeight: '1.2',
  margin: '0 0 12px',
};
const blurb: React.CSSProperties = {
  color: 'rgba(255,253,246,0.8)',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 20px',
};
const card: React.CSSProperties = {
  borderTop: '1px solid rgba(255,253,246,0.12)',
  margin: '0 0 16px',
};
const rowLabel: React.CSSProperties = {
  color: '#4A8CC6',
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  padding: '10px 0',
  verticalAlign: 'top',
  width: '40%',
};
const rowValue: React.CSSProperties = {
  color: 'rgba(255,253,246,0.9)',
  fontSize: '14px',
  padding: '10px 0',
  textAlign: 'right',
};
const rowValueEmphasis: React.CSSProperties = {
  ...rowValue,
  color: '#FFFDF6',
  fontWeight: 'bold',
  fontSize: '16px',
};
const smallLine: React.CSSProperties = {
  margin: '0 0 20px',
  fontSize: '13px',
};
const link: React.CSSProperties = {
  color: '#4A8CC6',
  textDecoration: 'underline',
};
const policy: React.CSSProperties = {
  color: 'rgba(255,253,246,0.55)',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '8px 0 0',
};
const footer: React.CSSProperties = {
  backgroundColor: '#09090b',
  padding: '24px 28px',
  textAlign: 'center',
};
const footerName: React.CSSProperties = {
  color: '#e4e4e7',
  fontSize: '13px',
  fontWeight: 'bold',
  margin: '0 0 4px',
};
const footerText: React.CSSProperties = {
  color: '#a1a1aa',
  fontSize: '12px',
  margin: '0 0 4px',
};
const footerLink: React.CSSProperties = {
  color: '#a1a1aa',
  textDecoration: 'underline',
};
