import { Link, Section, Text } from '@react-email/components';
import {
  LLC_NAME,
  ZVC_EMAIL_ADDRESS,
  ZVC_SITE_URL,
} from '@/app/contsants/constants';
import type { LoyaltyNotice } from '@/lib/loyalty';
import LoyaltyProgress from './components/LoyaltyProgress';
import {
  BrandFooter,
  BrandHeader,
  EmailShell,
  FooterLine,
  FooterLink,
  Kicker,
  OutlineButton,
  Row,
  STATIC,
  BODY_FONT,
  Title,
  bodyTextStyle,
  contentStyle,
  linkStyle,
  panelStyle,
} from './components/brand';

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
  /** Set when this refund changed the buyer's free-ticket status. */
  loyalty?: LoyaltyNotice | null;
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
  loyalty,
}: Props) {
  const refundedTo =
    cardBrand && cardLast4 ? `${cardBrand} ending in ${cardLast4}` : null;

  return (
    <EmailShell preview={`Your refund for ${eventName} has been processed`}>
      <BrandHeader />
      <Section style={contentStyle} className="zvc-pad">
        <Kicker>Refund processed</Kicker>
        <Title>You&apos;ve been refunded</Title>
        <Text style={bodyTextStyle}>
          Your refund for <strong>{eventName}</strong> has been processed. The
          ticket for this order has been invalidated and is no longer valid for
          entry. Refunds typically take 5–10 business days to appear, depending
          on your bank.
        </Text>

        {/* Transaction details */}
        <Section style={panelStyle}>
          <Row label="Order #" value={`${orderNumber}`} />
          <Row label="Event" value={eventName} />
          <Row label="Refund date" value={fmtDate(refundDate)} />
          <Row label="Refunded to" value={refundedTo} />
          <Row
            label="Refund total"
            value={`$${refundAmount.toFixed(2)} ${(currency ?? 'USD').toUpperCase()}`}
            emphasize
          />
        </Section>

        {receiptUrl && (
          <Section style={{ margin: '0 0 24px' }}>
            <OutlineButton href={receiptUrl}>View official receipt</OutlineButton>
          </Section>
        )}

        {loyalty && <LoyaltyProgress notice={loyalty} />}

        <Text style={policy}>
          <strong>Refund &amp; Cancellation Policy:</strong> Refunds are
          automatic when requested at least 48 hours before an event&apos;s start
          time. Within 48 hours, email{' '}
          <Link href={`mailto:${ZVC_EMAIL_ADDRESS}`} style={linkStyle}>
            {ZVC_EMAIL_ADDRESS}
          </Link>
          . Full{' '}
          <Link href={TERMS_URL} style={linkStyle}>
            Terms of Service
          </Link>
          .
        </Text>
      </Section>

      <BrandFooter>
        <FooterLine>
          Support:{' '}
          <FooterLink href={`mailto:${ZVC_EMAIL_ADDRESS}`}>
            {ZVC_EMAIL_ADDRESS}
          </FooterLink>
        </FooterLine>
        <FooterLine>
          © {new Date().getFullYear()} {LLC_NAME}
        </FooterLine>
      </BrandFooter>
    </EmailShell>
  );
}

const policy: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '15px',
  lineHeight: '1.55',
  color: STATIC,
  margin: 0,
};
