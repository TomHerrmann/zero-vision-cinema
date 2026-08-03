import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  verify: vi.fn(),
  findByID: vi.fn(),
  find: vi.fn(),
  refundCreate: vi.fn(),
}));

vi.mock('@/lib/refundToken', () => ({ verifyRefundToken: h.verify }));
vi.mock('@/lib/stripe', () => ({
  stripeCheckout: { refunds: { create: h.refundCreate } },
}));
vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    findByID: h.findByID,
    find: h.find,
  }),
}));
vi.mock('@payload-config', () => ({ default: {} }));
vi.mock('@/lib/logtail', () => ({
  logtail: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { POST } from './route';

const farFuture = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
const soon = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

const order = {
  id: 5,
  productId: 'prod_1',
  paymentIntentId: 'pi_1',
  amountPaid: 10,
  quantity: 1,
  refundedAt: null as string | null,
};

const req = (body: unknown) =>
  ({ json: async () => body }) as unknown as import('next/server').NextRequest;

beforeEach(() => {
  h.verify.mockReset().mockReturnValue(true);
  h.findByID.mockReset().mockResolvedValue({ ...order });
  h.find.mockReset().mockResolvedValue({ docs: [{ id: 1, datetime: farFuture }] });
  h.refundCreate.mockReset().mockResolvedValue({ id: 're_1' });
});

describe('POST /api/refund', () => {
  it('403s on an invalid token, without issuing a refund', async () => {
    h.verify.mockReturnValue(false);
    const res = await POST(req({ order: 5, token: 'bad' }));
    expect(res.status).toBe(403);
    expect(h.refundCreate).not.toHaveBeenCalled();
  });

  it('409s when the order is already refunded', async () => {
    h.findByID.mockResolvedValue({ ...order, refundedAt: '2026-01-01T00:00:00Z' });
    const res = await POST(req({ order: 5, token: 'ok' }));
    expect(res.status).toBe(409);
    expect(h.refundCreate).not.toHaveBeenCalled();
  });

  it('422s (and does not refund) when the event is within 48h', async () => {
    h.find.mockResolvedValue({ docs: [{ id: 1, datetime: soon }] });
    const res = await POST(req({ order: 5, token: 'ok' }));
    expect(res.status).toBe(422);
    expect((await res.json()).withinWindow).toBe(true);
    expect(h.refundCreate).not.toHaveBeenCalled();
  });

  it('issues the Stripe refund when valid and >48h out', async () => {
    const res = await POST(req({ order: 5, token: 'ok' }));
    expect(res.status).toBe(200);
    expect(h.refundCreate).toHaveBeenCalledWith({ payment_intent: 'pi_1' });
  });

  it('404s when the order is missing', async () => {
    h.findByID.mockResolvedValue(null);
    const res = await POST(req({ order: 5, token: 'ok' }));
    expect(res.status).toBe(404);
  });
});
