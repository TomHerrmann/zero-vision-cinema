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
  EMAIL_EYEBALL_SLASHED_PNG_URL,
} from '@/app/contsants/constants';

const EVENTS_URL = `${ZVC_SITE_URL}/events`;

interface Props {
  /** Single-use code, e.g. ZVC-7K3Q-M9XA. */
  code: string;
  /** ISO datetime the code stops working. */
  expiresAt: string;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'long',
  });
}

/** Sent when 3 purchases in 30 days earn a free-ticket code (lib/loyalty). */
export default function RewardEmail({ code, expiresAt }: Props) {
  return (
    <Html>
      <Head />
      <Preview>Your free ticket code: {code}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={EMAIL_HEADER_IMAGE_ZVC_URL}
            width="100%"
            alt="Zero Vision Cinema"
            style={header}
          />
          <Section style={content}>
            <Img
              src={EMAIL_EYEBALL_SLASHED_PNG_URL}
              width="96"
              height="96"
              alt="Zero Vision Cinema"
              style={mark}
            />
            <Text style={kicker}>3 screenings in 30 days</Text>
            <Heading style={heading}>Your next ticket is on us</Heading>
            <Text style={blurb}>
              Thanks for coming out to Zero Vision Cinema. Here&apos;s a code
              for one free ticket to any upcoming screening.
            </Text>

            <Section style={codeBox}>
              <Text style={codeLabel}>Your code</Text>
              <Text style={codeText}>{code}</Text>
              <Text style={codeExpiry}>Valid through {fmtDate(expiresAt)}</Text>
            </Section>

            <Text style={blurb}>
              <strong>How to use it:</strong> pick a screening, tap{' '}
              <em>Have a free-ticket code?</em> at checkout, and enter this code
              with the email address this message was sent to.
            </Text>

            <Section style={ctaWrap}>
              <Link href={EVENTS_URL} style={cta}>
                Pick a screening
              </Link>
            </Section>

            <Text style={policy}>
              One free ticket, single use. The code only works with this email
              address. If a purchase that earned it is refunded, the code is
              cancelled.
            </Text>
          </Section>

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
const content: React.CSSProperties = {
  padding: '32px 28px',
  textAlign: 'center',
};
const mark: React.CSSProperties = { display: 'block', margin: '0 auto 16px' };
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
const codeBox: React.CSSProperties = {
  border: '2px dashed #4A8CC6',
  backgroundColor: 'rgba(74,140,198,0.08)',
  padding: '20px',
  margin: '0 0 24px',
};
const codeLabel: React.CSSProperties = {
  color: '#4A8CC6',
  textTransform: 'uppercase',
  letterSpacing: '2px',
  fontSize: '11px',
  margin: '0 0 6px',
};
const codeText: React.CSSProperties = {
  color: '#FFFDF6',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '28px',
  fontWeight: 'bold',
  letterSpacing: '3px',
  margin: '0 0 6px',
};
const codeExpiry: React.CSSProperties = {
  color: 'rgba(255,253,246,0.65)',
  fontSize: '13px',
  margin: 0,
};
const ctaWrap: React.CSSProperties = { margin: '0 0 24px' };
const cta: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#4A8CC6',
  color: '#FFFDF6',
  fontWeight: 'bold',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  fontSize: '14px',
  padding: '12px 24px',
  textDecoration: 'none',
};
const policy: React.CSSProperties = {
  color: 'rgba(255,253,246,0.55)',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: 0,
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
