import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Payload } from 'payload';
import { PgDialect } from 'drizzle-orm/pg-core';
import {
  claimReward,
  computeLoyaltyStatus,
  findUsableReward,
  generateRewardCode,
  getRefundEmailNotice,
  getTicketEmailNotice,
  isQualifyingOrder,
  isRewardUsable,
  maybeIssueReward,
  normalizeRewardCode,
  voidRewardForRefund,
} from './loyalty';

const NOW = new Date('2026-09-18T12:00:00.000Z');
const daysAgo = (n: number) =>
  new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

type O = Parameters<typeof isQualifyingOrder>[0] & Record<string, unknown>;
const order = (id: number, over: Partial<O> = {}): O => ({
  id,
  customerId: 'cus_1',
  amountPaid: 13,
  transactionDate: daysAgo(1),
  refundedAt: null,
  item: { relationTo: 'events', value: 3 },
  earnedReward: null,
  redeemedReward: null,
  ...over,
});

/** Fake Payload: `find` returns `orders`/`rewards` docs; raw SQL goes to `exec`. */
function fakePayload() {
  const h = {
    orders: [] as O[],
    rewards: [] as Record<string, unknown>[],
    find: vi.fn(),
    findByID: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    exec: vi.fn(),
  };
  h.find.mockImplementation(async ({ collection }: { collection: string }) => ({
    docs: collection === 'orders' ? h.orders : h.rewards,
  }));
  h.create.mockImplementation(async ({ data }: { data: object }) => ({ id: 99, ...data }));
  h.exec.mockResolvedValue({ rows: [] });
  const payload = {
    find: h.find,
    findByID: h.findByID,
    create: h.create,
    delete: h.delete,
    db: { drizzle: { execute: h.exec } },
  } as unknown as Payload;
  return { h, payload };
}

describe('codes', () => {
  it('generates ZVC-XXXX-XXXX with no ambiguous characters', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateRewardCode()).toMatch(/^ZVC-[A-HJKMNP-Z2-9]{4}-[A-HJKMNP-Z2-9]{4}$/);
    }
  });

  it('normalizes case, spaces and dashes', () => {
    expect(normalizeRewardCode(' zvc 7k3q m9xa ')).toBe('ZVC-7K3Q-M9XA');
    expect(normalizeRewardCode('ZVC-7K3Q-M9XA')).toBe('ZVC-7K3Q-M9XA');
    expect(normalizeRewardCode('')).toBe('');
  });
});

describe('isQualifyingOrder', () => {
  it('counts a paid, unrefunded, uncounted ticket order in the window', () => {
    expect(isQualifyingOrder(order(1), NOW)).toBe(true);
  });

  it.each([
    ['refunded', { refundedAt: daysAgo(0) }],
    ['free (reward) order', { amountPaid: 0, redeemedReward: 5 }],
    ['already counted toward a reward', { earnedReward: 5 }],
    ['merch', { item: { relationTo: 'merch', value: 1 } }],
    ['older than 30 days', { transactionDate: daysAgo(30.01) }],
  ])('excludes %s', (_label, over) => {
    expect(isQualifyingOrder(order(1, over as Partial<O>), NOW)).toBe(false);
  });

  it('includes an order just inside the window', () => {
    expect(isQualifyingOrder(order(1, { transactionDate: daysAgo(29.99) }), NOW)).toBe(true);
  });
});

describe('computeLoyaltyStatus', () => {
  it('has no deadline with no purchases', () => {
    expect(computeLoyaltyStatus([], NOW)).toEqual({ count: 0, remaining: 3, deadline: null });
  });

  it('counts down with a deadline 30 days after the oldest purchase', () => {
    const status = computeLoyaltyStatus(
      [{ transactionDate: '2026-09-01T00:00:00.000Z' }, { transactionDate: daysAgo(1) }],
      NOW
    );
    expect(status.remaining).toBe(1);
    expect(status.deadline).toBe('2026-10-01T00:00:00.000Z');
  });
});

describe('isRewardUsable', () => {
  const base = { redeemedAt: null, voidedAt: null, expiresAt: daysAgo(-1) };
  it('is usable when unused and unexpired', () => {
    expect(isRewardUsable(base, NOW)).toBe(true);
  });
  it.each([
    ['redeemed', { redeemedAt: daysAgo(0) }],
    ['voided', { voidedAt: daysAgo(0) }],
    ['expired', { expiresAt: daysAgo(0.001) }],
  ])('is not usable when %s', (_l, over) => {
    expect(isRewardUsable({ ...base, ...over }, NOW)).toBe(false);
  });
});

describe('maybeIssueReward', () => {
  let f: ReturnType<typeof fakePayload>;
  beforeEach(() => {
    f = fakePayload();
  });

  it('does nothing below the threshold', async () => {
    f.h.orders = [order(1), order(2)];
    expect(await maybeIssueReward(f.payload, 'cus_1', NOW)).toBeNull();
    expect(f.h.create).not.toHaveBeenCalled();
  });

  it('ignores non-qualifying orders when counting', async () => {
    f.h.orders = [order(1), order(2), order(3, { refundedAt: daysAgo(0) })];
    expect(await maybeIssueReward(f.payload, 'cus_1', NOW)).toBeNull();
  });

  it('issues a 30-day reward and consumes exactly 3 orders at the threshold', async () => {
    f.h.orders = [order(1), order(2), order(3)];
    f.h.exec.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }, { id: 3 }] });

    const reward = await maybeIssueReward(f.payload, 'cus_1', NOW);

    expect(reward).toMatchObject({ id: 99, customerId: 'cus_1' });
    const data = f.h.create.mock.calls[0][0].data;
    expect(data.expiresAt).toBe('2026-10-18T12:00:00.000Z');
    expect(f.h.exec).toHaveBeenCalledTimes(1);
    expect(f.h.delete).not.toHaveBeenCalled();
  });

  it('consumes only the oldest 3 when there are more', async () => {
    f.h.orders = [order(1), order(2), order(3), order(4)];
    f.h.exec.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }, { id: 3 }] });

    await maybeIssueReward(f.payload, 'cus_1', NOW);

    const { sql, params } = new PgDialect().sqlToQuery(f.h.exec.mock.calls[0][0]);
    expect(sql).toContain('"earned_reward_id" IS NULL');
    expect(params).toEqual([99, 1, 2, 3]);
  });

  it('rolls back when a concurrent call already consumed some orders', async () => {
    f.h.orders = [order(1), order(2), order(3)];
    f.h.exec.mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] });

    expect(await maybeIssueReward(f.payload, 'cus_1', NOW)).toBeNull();
    // Released what it did claim, and removed the reward.
    expect(f.h.exec).toHaveBeenCalledTimes(2);
    expect(f.h.delete).toHaveBeenCalledWith({ collection: 'rewards', id: 99 });
  });
});

describe('findUsableReward / claimReward', () => {
  it('finds a usable code regardless of formatting', async () => {
    const f = fakePayload();
    f.h.rewards = [{ id: 5, code: 'ZVC-7K3Q-M9XA', redeemedAt: null, voidedAt: null, expiresAt: daysAgo(-5) }];
    const reward = await findUsableReward(f.payload, 'zvc7k3qm9xa', NOW);
    expect(reward?.id).toBe(5);
    expect(f.h.find.mock.calls[0][0].where).toEqual({ code: { equals: 'ZVC-7K3Q-M9XA' } });
  });

  it('rejects a used code', async () => {
    const f = fakePayload();
    f.h.rewards = [{ id: 5, code: 'ZVC-7K3Q-M9XA', redeemedAt: daysAgo(1), voidedAt: null, expiresAt: daysAgo(-5) }];
    expect(await findUsableReward(f.payload, 'ZVC-7K3Q-M9XA', NOW)).toBeNull();
  });

  it('claims only when the conditional update wins', async () => {
    const f = fakePayload();
    f.h.exec.mockResolvedValueOnce({ rows: [{ id: 5 }] });
    expect(await claimReward(f.payload, 5)).toBe(true);
    f.h.exec.mockResolvedValueOnce({ rows: [] });
    expect(await claimReward(f.payload, 5)).toBe(false);
  });
});

describe('voidRewardForRefund', () => {
  it('does nothing for an order that earned no reward', async () => {
    const f = fakePayload();
    expect(await voidRewardForRefund(f.payload, { id: 1, earnedReward: null })).toBeNull();
    expect(f.h.exec).not.toHaveBeenCalled();
  });

  it('voids an unused reward and releases the other orders', async () => {
    const f = fakePayload();
    f.h.exec.mockResolvedValueOnce({ rows: [{ code: 'ZVC-7K3Q-M9XA' }] });

    const effect = await voidRewardForRefund(f.payload, { id: 1, earnedReward: 5 });

    expect(effect).toEqual({ kind: 'voided', code: 'ZVC-7K3Q-M9XA' });
    expect(f.h.exec).toHaveBeenCalledTimes(2);
  });

  it('leaves an already-redeemed reward alone', async () => {
    const f = fakePayload();
    f.h.exec.mockResolvedValueOnce({ rows: [] });
    f.h.findByID.mockResolvedValue({ id: 5, code: 'ZVC-7K3Q-M9XA', redeemedAt: daysAgo(1) });

    const effect = await voidRewardForRefund(f.payload, { id: 1, earnedReward: { id: 5 } as never });

    expect(effect).toEqual({ kind: 'alreadyRedeemed', code: 'ZVC-7K3Q-M9XA' });
    expect(f.h.exec).toHaveBeenCalledTimes(1); // no release
  });
});

describe('email notices', () => {
  it('ticket: progress for a counted purchase', async () => {
    const f = fakePayload();
    f.h.orders = [order(1, { transactionDate: '2026-09-10T00:00:00.000Z' }), order(2)];
    const notice = await getTicketEmailNotice(f.payload, order(2) as never, NOW);
    expect(notice).toEqual({ kind: 'progress', remaining: 1, deadline: '2026-10-10T00:00:00.000Z' });
  });

  it('ticket: earned when this purchase completed a reward', async () => {
    const f = fakePayload();
    expect(await getTicketEmailNotice(f.payload, order(3, { earnedReward: 9 }) as never, NOW)).toEqual({
      kind: 'earned',
    });
  });

  it('ticket: redeemed for a free ticket', async () => {
    const f = fakePayload();
    f.h.findByID.mockResolvedValue({ id: 9, code: 'ZVC-7K3Q-M9XA' });
    const notice = await getTicketEmailNotice(
      f.payload,
      order(3, { amountPaid: 0, redeemedReward: 9 }) as never,
      NOW
    );
    expect(notice).toEqual({ kind: 'redeemed', code: 'ZVC-7K3Q-M9XA' });
  });

  it('refund: voided reward with new progress', async () => {
    const f = fakePayload();
    f.h.findByID.mockResolvedValue({ id: 9, code: 'ZVC-7K3Q-M9XA', voidedAt: daysAgo(0) });
    f.h.orders = [order(1), order(2)];
    const notice = await getRefundEmailNotice(
      f.payload,
      order(3, { earnedReward: 9, refundedAt: daysAgo(0) }) as never,
      NOW
    );
    expect(notice).toMatchObject({ kind: 'voided', code: 'ZVC-7K3Q-M9XA', remaining: 1 });
  });

  it('refund: nothing when the reward was already redeemed', async () => {
    const f = fakePayload();
    f.h.findByID.mockResolvedValue({ id: 9, code: 'X', voidedAt: null, redeemedAt: daysAgo(1) });
    const notice = await getRefundEmailNotice(
      f.payload,
      order(3, { earnedReward: 9, refundedAt: daysAgo(0) }) as never,
      NOW
    );
    expect(notice).toBeNull();
  });

  it('refund: progress when the order was counting toward one', async () => {
    const f = fakePayload();
    f.h.orders = [order(1)];
    const notice = await getRefundEmailNotice(
      f.payload,
      order(2, { refundedAt: daysAgo(0) }) as never,
      NOW
    );
    expect(notice).toMatchObject({ kind: 'progress', remaining: 2, afterRefund: true });
  });

  it('refund: nothing for an order outside the window', async () => {
    const f = fakePayload();
    const notice = await getRefundEmailNotice(
      f.payload,
      order(2, { refundedAt: daysAgo(0), transactionDate: daysAgo(40) }) as never,
      NOW
    );
    expect(notice).toBeNull();
  });
});
