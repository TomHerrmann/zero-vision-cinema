import { describe, it, expect } from 'vitest';
import { render } from '@react-email/render';
import TicketEmail from './TicketEmail';
import RefundEmail from './RefundEmail';
import RewardEmail from './RewardEmail';
import BroadcastEmail from './BroadcastEmail';
import CustomBroadcastEmail from './CustomBroadcastEmail';
import { emailLink } from './components/brand';
import {
  ticketSample,
  refundSample,
  rewardSample,
  broadcastPaidSample,
  customBroadcastSample,
} from './previews/sample-data';

describe('emailLink', () => {
  it('tags the email source and template, keeping the existing query', () => {
    const url = emailLink(
      'https://www.youtube.com/@zerovisioncinema?sub_confirmation=1',
      'ticket'
    );
    const params = new URL(url).searchParams;
    expect(params.get('sub_confirmation')).toBe('1');
    expect(params.get('utm_source')).toBe('email');
    expect(params.get('utm_medium')).toBe('ticket');
  });
});

describe('Follow Us block', () => {
  const cases = [
    ['ticket', <TicketEmail key="t" {...ticketSample} />],
    ['refund', <RefundEmail key="r" {...refundSample} />],
    ['reward', <RewardEmail key="w" {...rewardSample} />],
    ['broadcast', <BroadcastEmail key="b" {...broadcastPaidSample} />],
    [
      'custom-broadcast',
      <CustomBroadcastEmail key="c" {...customBroadcastSample} />,
    ],
  ] as const;

  it.each(cases)('appears in the %s email with tagged links', async (kind, el) => {
    const html = await render(el);
    expect(html).toContain('Follow Us');
    for (const host of [
      'youtube.com/@zerovisioncinema',
      'instagram.com/zerovisioncinema',
      'tiktok.com/@zerovisioncinema',
      'zerovisioncinema.substack.com/subscribe',
      'zerovisioncinema.com/join',
    ]) {
      expect(html).toMatch(
        new RegExp(
          `${host.replace(/[.?/]/g, '\\$&')}[^"]*utm_source=email&amp;utm_medium=${kind}`
        )
      );
    }
  });
});
