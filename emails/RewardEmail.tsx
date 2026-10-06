import { Img, Section, Text } from '@react-email/components';
import {
  LLC_NAME,
  ZVC_EMAIL_ADDRESS,
  ZVC_SITE_URL,
  EMAIL_EYEBALL_SLASHED_PNG_URL,
} from '@/app/contsants/constants';
import { REWARD_PURCHASES, WINDOW_DAYS } from '@/lib/loyalty';
import {
  BODY_FONT,
  BrandFooter,
  BrandHeader,
  EmailShell,
  FooterLine,
  FooterLink,
  GLOW,
  Kicker,
  LABEL_FONT,
  PANEL,
  PrimaryButton,
  RETRO_BLUE,
  STATIC,
  Title,
  bodyTextStyle,
  contentStyle,
} from './components/brand';

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

/** Sent when 3 purchases in 60 days earn a free-ticket code (lib/loyalty). */
export default function RewardEmail({ code, expiresAt }: Props) {
  return (
    <EmailShell preview={`Your free ticket code: ${code}`}>
      <BrandHeader />
      <Section style={{ ...contentStyle, textAlign: 'center' }} className="zvc-pad">
        <Img
          src={EMAIL_EYEBALL_SLASHED_PNG_URL}
          width="96"
          height="96"
          alt="Zero Vision Cinema"
          style={mark}
        />
        <Kicker align="center">{`${REWARD_PURCHASES} screenings in ${WINDOW_DAYS} days`}</Kicker>
        <Title align="center">Your next ticket is on us</Title>
        <Text style={bodyTextStyle}>
          Thanks for coming out to Zero Vision Cinema. Here&apos;s a code for
          one free ticket to any upcoming screening.
        </Text>

        <Section style={codeBox}>
          <Text style={codeLabel}>Your code</Text>
          <Text style={codeText}>{code}</Text>
          <Text style={codeExpiry}>Valid through {fmtDate(expiresAt)}</Text>
        </Section>

        <Text style={bodyTextStyle}>
          <strong>How to use it:</strong> pick a screening, tap{' '}
          <em>Have a free-ticket code?</em> at checkout, and enter this code with
          the email address this message was sent to.
        </Text>

        <Section style={{ margin: '0 0 28px' }}>
          <PrimaryButton href={EVENTS_URL}>Pick a screening</PrimaryButton>
        </Section>

        <Text style={policy}>
          One free ticket, single use. The code only works with this email
          address. If a purchase that earned it is refunded, the code is
          cancelled.
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

const mark: React.CSSProperties = { display: 'block', margin: '0 auto 18px' };
const codeBox: React.CSSProperties = {
  backgroundColor: PANEL,
  border: `2px dashed ${RETRO_BLUE}`,
  borderRadius: '6px',
  padding: '20px',
  margin: '0 0 24px',
};
const codeLabel: React.CSSProperties = {
  fontFamily: LABEL_FONT,
  fontWeight: 700,
  fontSize: '12px',
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: RETRO_BLUE,
  margin: '0 0 6px',
};
// Monospace on purpose: a code has to read unambiguously (0 vs O, 1 vs I).
const codeText: React.CSSProperties = {
  color: GLOW,
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '28px',
  fontWeight: 'bold',
  letterSpacing: '3px',
  margin: '0 0 6px',
};
const codeExpiry: React.CSSProperties = {
  fontFamily: BODY_FONT,
  color: STATIC,
  fontSize: '15px',
  margin: 0,
};
const policy: React.CSSProperties = {
  fontFamily: BODY_FONT,
  color: STATIC,
  fontSize: '14px',
  lineHeight: '1.55',
  margin: 0,
};
