import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  verify: vi.fn(),
  create: vi.fn(),
}));

vi.mock('@/lib/refundToken', () => ({ verifyRefundToken: h.verify }));
vi.mock('@/lib/refundRequests', () => ({ createRefundRequest: h.create }));
vi.mock('payload', () => ({ getPayload: vi.fn().mockResolvedValue({}) }));
vi.mock('@payload-config', () => ({ default: {} }));
vi.mock('@/lib/logtail', () => ({
  logtail: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { POST } from './route';

const req = (body: unknown) =>
  ({ json: async () => body }) as unknown as import('next/server').NextRequest;

beforeEach(() => {
  h.verify.mockReset().mockReturnValue(true);
  h.create.mockReset().mockResolvedValue({ ok: true, id: 1, existing: false });
});

describe('POST /api/refund', () => {
  it('403s on an invalid token, without filing a request', async () => {
    h.verify.mockReturnValue(false);
    const res = await POST(req({ order: 5, token: 'bad' }));
    expect(res.status).toBe(403);
    expect(h.create).not.toHaveBeenCalled();
  });

  it('files a buyer refund request (no refund issued here)', async () => {
    const res = await POST(req({ order: 5, token: 'ok' }));
    expect(res.status).toBe(200);
    expect(h.create).toHaveBeenCalledWith({}, 5, 'buyer');
  });

  it('passes through already-refunded / missing-order errors', async () => {
    h.create.mockResolvedValue({ ok: false, status: 409, error: 'This order has already been refunded.' });
    const res = await POST(req({ order: 5, token: 'ok' }));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe('This order has already been refunded.');
  });

  it('tells the buyer to email us when the order has no Stripe payment', async () => {
    h.create.mockResolvedValue({ ok: false, status: 400, error: 'internal' });
    const res = await POST(req({ order: 5, token: 'ok' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe('This order cannot be refunded online. Please email us.');
  });
});
