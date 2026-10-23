import { Section, Text } from '@react-email/components';
import type { RefundRequestSummary } from '@/lib/refundRequests';
import {
  BrandHeader,
  EmailShell,
  Kicker,
  PrimaryButton,
  Row,
  Title,
  bodyTextStyle,
  contentStyle,
  panelStyle,
} from './components/brand';

/**
 * Internal: tells us a buyer asked for a refund. Nothing has been refunded;
 * the button opens the request in the admin, where we approve or decline.
 * Carries no customer details — those stay in Stripe.
 */
interface Props {
  summary: RefundRequestSummary;
  /** Admin URL of the request. */
  reviewUrl: string;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

function loyaltyLine(summary: RefundRequestSummary): string | null {
  const { countsTowardProgress, earnedCode, otherUsableCodes } = summary.loyalty;
  const parts: string[] = [];
  if (earnedCode) parts.push(`voids code ${earnedCode} automatically`);
  else if (countsTowardProgress) parts.push('drops one purchase from their progress');
  if (otherUsableCodes.length) parts.push(`they also hold ${otherUsableCodes.join(', ')}`);
  return parts.length ? parts.join('; ') : null;
}

export default function RefundRequestEmail({ summary, reviewUrl }: Props) {
  const event = summary.eventName ?? 'an event';
  return (
    <EmailShell preview={`Refund request: order ${summary.orderId}, ${event}`}>
      <BrandHeader />
      <Section style={contentStyle} className="zvc-pad">
        <Kicker>Refund request</Kicker>
        <Title>Approve or decline</Title>
        <Text style={bodyTextStyle}>
          Nothing has been refunded. Open the request to approve or decline it.
        </Text>
        <Section style={panelStyle}>
          <Row label="Order #" value={`${summary.orderId}`} />
          <Row label="Event" value={event} />
          <Row
            label="Event date"
            value={
              summary.eventDate
                ? `${fmtDate(summary.eventDate)}${summary.eventPassed ? ' (already happened)' : ''}`
                : null
            }
          />
          <Row label="Tickets" value={`${summary.quantity}`} />
          <Row label="Requested" value={fmtDate(summary.requestedAt)} />
          <Row label="Loyalty" value={loyaltyLine(summary)} />
          <Row label="Amount" value={`$${summary.amountPaid.toFixed(2)}`} emphasize />
        </Section>
        <Section style={{ margin: '0 0 36px' }}>
          <PrimaryButton href={reviewUrl}>Review request</PrimaryButton>
        </Section>
      </Section>
    </EmailShell>
  );
}
