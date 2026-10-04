import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  list: vi.fn(),
  update: vi.fn(),
  find: vi.fn(),
}));

vi.mock('@/lib/stripe', () => ({
  stripe: { paymentLinks: { list: h.list, update: h.update } },
}));

import { retirePastPaymentLinks } from './retirePaymentLinks';

// 2026-10-04 09:00 ET.
const NOW = new Date('2026-10-04T13:00:00.000Z');
const payload = { find: h.find } as never;

/** Stripe's auto-paginating list is async-iterable. */
const activeLinks = (links: { id: string; url: string }[]) => ({
  async *[Symbol.asyncIterator]() {
    yield* links;
  },
});

beforeEach(() => {
  h.find.mockReset().mockResolvedValue({ docs: [] });
  h.list.mockReset().mockReturnValue(activeLinks([]));
  h.update.mockReset().mockResolvedValue({});
});

describe('retirePastPaymentLinks', () => {
  it('only looks at events dated before today in ET', async () => {
    await retirePastPaymentLinks(payload, NOW);
    expect(h.find.mock.calls[0][0].where.datetime).toEqual({
      less_than: '2026-10-04T04:00:00.000Z',
    });
  });

  it('deactivates active links of past events, by id or by URL', async () => {
    h.find.mockResolvedValue({
      docs: [
        { paymentLinkId: 'plink_old', paymentLink: 'https://buy.stripe.com/a' },
        // Saved before paymentLinkId existed — URL only.
        { paymentLinkId: null, paymentLink: 'https://buy.stripe.com/b' },
      ],
    });
    h.list.mockReturnValue(
      activeLinks([
        { id: 'plink_old', url: 'https://buy.stripe.com/a' },
        { id: 'plink_legacy', url: 'https://buy.stripe.com/b' },
        { id: 'plink_upcoming', url: 'https://buy.stripe.com/c' },
      ])
    );

    const retired = await retirePastPaymentLinks(payload, NOW);

    expect(retired).toEqual(['plink_old', 'plink_legacy']);
    expect(h.list).toHaveBeenCalledWith({ active: true, limit: 100 });
    expect(h.update).toHaveBeenCalledTimes(2);
    expect(h.update).toHaveBeenCalledWith('plink_old', { active: false });
    expect(h.update).toHaveBeenCalledWith('plink_legacy', { active: false });
  });

  it('skips Stripe entirely when no past event has a link', async () => {
    expect(await retirePastPaymentLinks(payload, NOW)).toEqual([]);
    expect(h.list).not.toHaveBeenCalled();
  });
});
