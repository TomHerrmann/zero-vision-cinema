import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Payload } from 'payload';
import { PgDialect } from 'drizzle-orm/pg-core';

const h = vi.hoisted(() => ({
  refundCreate: vi.fn(),
  publish: vi.fn(),
  voidCodes: vi.fn(),
}));

vi.mock('@/lib/stripe', () => ({
  stripeCheckout: { refunds: { create: h.refundCreate } },
}));
vi.mock('@/lib/qstash', () => ({
  qstash: { publishJSON: h.publish },
  QSTASH_TARGET_BASE_URL: 'https://example.test',
}));
vi.mock('@/lib/logtail', () => ({
  logtail: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));
vi.mock('@/lib/loyalty', async (orig) => ({
  ...(await orig<typeof import('@/lib/loyalty')>()),
  voidUsableRewardsForCustomer: h.voidCodes,
}));

import {
  approveRefundRequest,
  createRefundRequest,
  declineRefundRequest,
} from './refundRequests';

const order = {
  id: 1187,
  customerId: 'cus_1',
  paymentIntentId: 'pi_1',
  refundedAt: null as string | null,
  earnedReward: null as number | null,
};

function fakePayload() {
  const f = {
    findByID: vi.fn().mockResolvedValue({ ...order }),
    find: vi.fn().mockResolvedValue({ docs: [] }),
    create: vi.fn().mockImplementation(async ({ data }) => ({ id: 42, ...data })),
    update: vi.fn().mockResolvedValue({}),
    exec: vi.fn().mockResolvedValue({ rows: [] }),
  };
  const payload = {
    findByID: f.findByID,
    find: f.find,
    create: f.create,
    update: f.update,
    db: { drizzle: { execute: f.exec } },
  } as unknown as Payload;
  return { f, payload };
}

const sqlOf = (call: unknown[]) => new PgDialect().sqlToQuery(call[0] as never).sql;

beforeEach(() => {
  h.refundCreate.mockReset().mockResolvedValue({ id: 're_1' });
  h.publish.mockReset().mockResolvedValue({});
  h.voidCodes.mockReset().mockResolvedValue([]);
});

describe('createRefundRequest', () => {
  it('files a pending buyer request and emails us, without refunding', async () => {
    const { f, payload } = fakePayload();
    const res = await createRefundRequest(payload, 1187, 'buyer');
    expect(res).toEqual({ ok: true, id: 42, existing: false });
    expect(f.create.mock.calls[0][0].data).toMatchObject({
      order: 1187,
      customerId: 'cus_1',
      status: 'pending',
      source: 'buyer',
    });
    expect(h.publish).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://example.test/api/tasks/send-refund-request-email' })
    );
    expect(h.refundCreate).not.toHaveBeenCalled();
  });

  it("doesn't email us for a request an admin filed", async () => {
    const { payload } = fakePayload();
    await createRefundRequest(payload, 1187, 'admin');
    expect(h.publish).not.toHaveBeenCalled();
  });

  it('returns the pending request instead of filing a second', async () => {
    const { f, payload } = fakePayload();
    f.find.mockResolvedValue({ docs: [{ id: 7 }] });
    expect(await createRefundRequest(payload, 1187, 'buyer')).toEqual({
      ok: true,
      id: 7,
      existing: true,
    });
    expect(f.create).not.toHaveBeenCalled();
  });

  it('refuses refunded and free orders', async () => {
    const { f, payload } = fakePayload();
    f.findByID.mockResolvedValueOnce({ ...order, refundedAt: '2026-10-01T00:00:00Z' });
    expect(await createRefundRequest(payload, 1187, 'buyer')).toMatchObject({ ok: false, status: 409 });
    f.findByID.mockResolvedValueOnce({ ...order, paymentIntentId: null });
    expect(await createRefundRequest(payload, 1187, 'buyer')).toMatchObject({ ok: false, status: 400 });
  });
});

describe('approveRefundRequest', () => {
  const claimedRow = { rows: [{ id: 42, order_id: 1187, customer_id: 'cus_1' }] };

  it('claims the request, issues one idempotent Stripe refund and records it', async () => {
    const { f, payload } = fakePayload();
    f.exec.mockResolvedValueOnce(claimedRow);

    const res = await approveRefundRequest(payload, 42, { userId: 1, voidRewards: false });

    expect(res).toEqual({ ok: true, refundId: 're_1', voidedCodes: [] });
    expect(sqlOf(f.exec.mock.calls[0])).toContain(`WHERE "id" = $2 AND "status" = 'pending'`);
    expect(h.refundCreate).toHaveBeenCalledWith(
      expect.objectContaining({ payment_intent: 'pi_1', reason: 'requested_by_customer' }),
      { idempotencyKey: 'refund-request-pi_1' }
    );
    expect(h.voidCodes).not.toHaveBeenCalled();
    expect(f.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { stripeRefundId: 're_1', voidedRewardCodes: null } })
    );
  });

  it('refuses a request that was already decided, with no refund', async () => {
    const { payload } = fakePayload(); // claim UPDATE returns no rows
    const res = await approveRefundRequest(payload, 42, { userId: 1, voidRewards: true });
    expect(res).toMatchObject({ ok: false, status: 409 });
    expect(h.refundCreate).not.toHaveBeenCalled();
  });

  it('puts the request back to pending when Stripe refuses', async () => {
    const { f, payload } = fakePayload();
    f.exec.mockResolvedValueOnce(claimedRow);
    h.refundCreate.mockRejectedValue(new Error('card_declined'));

    const res = await approveRefundRequest(payload, 42, { userId: 1, voidRewards: true });

    expect(res).toMatchObject({ ok: false, status: 502 });
    expect(sqlOf(f.exec.mock.calls[1])).toContain(`SET "status" = 'pending'`);
    expect(h.voidCodes).not.toHaveBeenCalled();
  });

  it("voids the buyer's other codes when asked, leaving the order's own code to the webhook", async () => {
    const { f, payload } = fakePayload();
    f.exec.mockResolvedValueOnce(claimedRow);
    f.findByID.mockResolvedValue({ ...order, earnedReward: 3 });
    h.voidCodes.mockResolvedValue(['ZVC-AAAA-BBBB']);

    const res = await approveRefundRequest(payload, 42, { userId: 1, voidRewards: true });

    expect(res).toEqual({ ok: true, refundId: 're_1', voidedCodes: ['ZVC-AAAA-BBBB'] });
    expect(h.voidCodes).toHaveBeenCalledWith(payload, 'cus_1', {
      exceptRewardId: 3,
      reason: expect.stringContaining('refund request 42'),
    });
  });
});

describe('declineRefundRequest', () => {
  it('closes a pending request and queues the decline email task', async () => {
    const { f, payload } = fakePayload();
    f.exec.mockResolvedValueOnce({ rows: [{ id: 42 }] });

    const res = await declineRefundRequest(payload, 42, { userId: 1 });

    // The decline wording is unwritten, so the email task will send nothing.
    expect(res).toEqual({ ok: true, declineEmail: false });
    expect(sqlOf(f.exec.mock.calls[0])).toContain(`SET "status" = 'declined'`);
    expect(h.publish).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'https://example.test/api/tasks/send-refund-declined-email' })
    );
    expect(h.refundCreate).not.toHaveBeenCalled();
  });

  it('refuses a request that was already decided', async () => {
    const { payload } = fakePayload();
    expect(await declineRefundRequest(payload, 42, { userId: 1 })).toMatchObject({
      ok: false,
      status: 409,
    });
    expect(h.publish).not.toHaveBeenCalled();
  });
});
