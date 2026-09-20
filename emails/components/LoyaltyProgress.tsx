import { Img, Link, Section, Text } from '@react-email/components';
import {
  EMAIL_EYEBALL_SLASHED_PNG_URL,
  ZVC_SITE_URL,
} from '@/app/contsants/constants';
import type { LoyaltyNotice } from '@/lib/loyalty';

const EVENTS_URL = `${ZVC_SITE_URL}/events`;

function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    month: 'long',
    day: 'numeric',
  });
}

function purchases(n: number): string {
  return `${n} more ticket purchase${n === 1 ? '' : 's'}`;
}

/** Progress sentence, e.g. "Make 2 more ticket purchases by October 12 …". */
function progressLine(remaining: number, deadline: string | null): string {
  if (remaining <= 0) return 'Your next free ticket is on its way.';
  if (!deadline) {
    return `Make ${remaining} ticket purchases within 30 days and your next ticket is on us.`;
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
        body: "That's 3 purchases in 30 days. Your free-ticket code is on its way in a separate email.",
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
 * Loyalty status block for transactional emails, marked with the slashed ZVC
 * eyeball. Styled inline to match the dark receipt emails.
 */
export default function LoyaltyProgress({ notice }: { notice: LoyaltyNotice }) {
  const { kicker, body } = loyaltyCopy(notice);
  return (
    <Section style={box}>
      <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
        <tr>
          <td style={markCell}>
            <Img
              src={EMAIL_EYEBALL_SLASHED_PNG_URL}
              width="60"
              height="60"
              alt="Zero Vision Cinema"
              style={mark}
            />
          </td>
          <td style={textCell}>
            <Text style={kickerStyle}>{kicker}</Text>
            <Text style={bodyStyle}>{body}</Text>
            {notice.kind !== 'redeemed' && (
              <Text style={linkLine}>
                <Link href={EVENTS_URL} style={link}>
                  See upcoming screenings
                </Link>
              </Text>
            )}
          </td>
        </tr>
      </table>
    </Section>
  );
}

const box: React.CSSProperties = {
  border: '1px solid rgba(74,140,198,0.5)',
  backgroundColor: 'rgba(74,140,198,0.08)',
  padding: '16px',
  margin: '0 0 20px',
};
const markCell: React.CSSProperties = {
  width: '72px',
  verticalAlign: 'top',
  paddingRight: '12px',
};
const mark: React.CSSProperties = { display: 'block' };
const textCell: React.CSSProperties = { verticalAlign: 'top' };
const kickerStyle: React.CSSProperties = {
  color: '#4A8CC6',
  textTransform: 'uppercase',
  letterSpacing: '2px',
  fontSize: '12px',
  fontWeight: 'bold',
  margin: '0 0 6px',
};
const bodyStyle: React.CSSProperties = {
  color: 'rgba(255,253,246,0.9)',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 6px',
};
const linkLine: React.CSSProperties = { fontSize: '13px', margin: 0 };
const link: React.CSSProperties = {
  color: '#4A8CC6',
  textDecoration: 'underline',
};
