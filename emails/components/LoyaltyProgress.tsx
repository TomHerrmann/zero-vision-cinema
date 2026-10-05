import { Img, Link, Section, Text } from '@react-email/components';
import {
  EMAIL_EYEBALL_PNG_URL,
  EMAIL_EYEBALL_SLASHED_PNG_URL,
  ZVC_SITE_URL,
} from '@/app/contsants/constants';
import { REWARD_PURCHASES, WINDOW_DAYS, type LoyaltyNotice } from '@/lib/loyalty';
import {
  BLACKOUT,
  BODY_FONT,
  GLOW,
  LABEL_FONT,
  PANEL,
  RETRO_BLUE,
  STATIC,
  labelStyle,
  linkStyle,
} from './brand';

const EVENTS_URL = `${ZVC_SITE_URL}/events`;

function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    month: 'long',
    day: 'numeric',
  });
}

function fmtLongDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    dateStyle: 'long',
  });
}

function purchases(n: number): string {
  return `${n} more ticket purchase${n === 1 ? '' : 's'}`;
}

/** Progress sentence, e.g. "Make 2 more ticket purchases by October 12 …". */
function progressLine(remaining: number, deadline: string | null): string {
  if (remaining <= 0) return 'Your next free ticket is on its way.';
  if (!deadline) {
    return `Make ${remaining} ticket purchases within ${WINDOW_DAYS} days and your next ticket is on us.`;
  }
  return `Make ${purchases(remaining)} by ${fmtDay(deadline)} and your next ticket is on us.`;
}

/** Headline + body copy for a notice. Exported for tests. */
export function loyaltyCopy(notice: LoyaltyNotice): {
  kicker: string;
  body: string;
} {
  switch (notice.kind) {
    case 'earned':
      return {
        kicker: 'You earned a free ticket',
        body: notice.code
          ? `That's ${REWARD_PURCHASES} purchases in ${WINDOW_DAYS} days. Here's a code for one free ticket to any upcoming screening.`
          : `That's ${REWARD_PURCHASES} purchases in ${WINDOW_DAYS} days. Your free-ticket code is on its way in a separate email.`,
      };
    case 'redeemed':
      return {
        kicker: 'Free ticket',
        body: `This ticket was paid for with your reward code${notice.code ? ` ${notice.code}` : ''}. Thanks for coming back.`,
      };
    case 'voided':
      return {
        kicker: 'Free-ticket code cancelled',
        body: `This order counted toward your free ticket, so code ${notice.code} is no longer valid. ${progressLine(notice.remaining, notice.deadline)}`,
      };
    case 'progress':
      return {
        kicker: notice.afterRefund ? 'Your free-ticket progress' : 'Earn a free ticket',
        body: notice.afterRefund
          ? `This refund no longer counts toward a free ticket. ${progressLine(notice.remaining, notice.deadline)}`
          : progressLine(notice.remaining, notice.deadline),
      };
  }
}

/**
 * Three eyeballs, one crossed out per qualifying purchase in the window, so
 * the third purchase crosses out all three.
 */
function Eyes({ count }: { count: number }) {
  const crossed = Math.min(Math.max(count, 0), REWARD_PURCHASES);
  return (
    <table cellPadding="0" cellSpacing="0" role="presentation" style={eyesTable}>
      <tr>
        {Array.from({ length: REWARD_PURCHASES }, (_, i) => (
          <td key={i} style={eyeCell}>
            <Img
              src={i < crossed ? EMAIL_EYEBALL_SLASHED_PNG_URL : EMAIL_EYEBALL_PNG_URL}
              width="52"
              alt={i < crossed ? 'Purchase counted' : 'Purchase to go'}
              style={eye}
            />
          </td>
        ))}
      </tr>
    </table>
  );
}

/**
 * Loyalty status block for transactional emails: the eyeball tally, then the
 * copy, and on the purchase that earns a reward, the code itself. Sits
 * directly under the ticket (or the refund totals).
 */
export default function LoyaltyProgress({ notice }: { notice: LoyaltyNotice }) {
  const { kicker, body } = loyaltyCopy(notice);
  return (
    <Section style={box}>
      <Eyes count={notice.count} />
      <Text style={kickerStyle}>{kicker}</Text>
      <Text style={bodyStyle}>{body}</Text>
      {notice.kind === 'earned' && notice.code && (
        <Section style={codeBox}>
          <Text style={codeLabel}>Your code</Text>
          <Text style={codeText}>{notice.code}</Text>
          {notice.expiresAt && (
            <Text style={codeExpiry}>{`Valid through ${fmtLongDate(notice.expiresAt)}`}</Text>
          )}
        </Section>
      )}
      {notice.kind !== 'redeemed' && (
        <Text style={linkLine}>
          <Link href={EVENTS_URL} style={linkStyle}>
            See upcoming screenings
          </Link>
        </Text>
      )}
    </Section>
  );
}

const box: React.CSSProperties = {
  backgroundColor: PANEL,
  border: `1px solid ${RETRO_BLUE}`,
  borderRadius: '6px',
  padding: '18px',
  margin: '0 0 24px',
};
const eyesTable: React.CSSProperties = { margin: '0 0 12px' };
const eyeCell: React.CSSProperties = { paddingRight: '10px' };
const eye: React.CSSProperties = { display: 'block' };
const kickerStyle: React.CSSProperties = { ...labelStyle, margin: '0 0 6px' };
const bodyStyle: React.CSSProperties = {
  fontFamily: BODY_FONT,
  color: GLOW,
  fontSize: '17px',
  lineHeight: '1.5',
  margin: '0 0 10px',
};
const codeBox: React.CSSProperties = {
  backgroundColor: BLACKOUT,
  border: `2px dashed ${RETRO_BLUE}`,
  borderRadius: '6px',
  padding: '16px',
  margin: '0 0 12px',
  textAlign: 'center',
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
// Monospace so the code reads unambiguously; user-select: all makes one tap
// or click select the whole code for copying (email can't run a copy button).
const codeText: React.CSSProperties = {
  color: GLOW,
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '26px',
  fontWeight: 'bold',
  letterSpacing: '3px',
  margin: '0 0 6px',
  userSelect: 'all',
  WebkitUserSelect: 'all',
};
const codeExpiry: React.CSSProperties = {
  fontFamily: BODY_FONT,
  color: STATIC,
  fontSize: '15px',
  margin: 0,
};
const linkLine: React.CSSProperties = {
  fontFamily: BODY_FONT,
  fontSize: '16px',
  margin: 0,
};
