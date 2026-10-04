import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ verify: vi.fn(), retire: vi.fn() }));

vi.mock('@/lib/qstash', () => ({ verifyQstashRequest: h.verify }));
vi.mock('@/lib/retirePaymentLinks', () => ({
  retireClosedPaymentLinks: h.retire,
}));
vi.mock('@/lib/logtail', () => ({ logtail: { error: vi.fn() } }));
vi.mock('payload', () => ({ getPayload: vi.fn().mockResolvedValue({}) }));
vi.mock('@payload-config', () => ({ default: {} }));

import { POST } from './route';

const req = () => new Request('http://localhost/api/tasks/retire-payment-links');

beforeEach(() => {
  h.verify.mockReset().mockResolvedValue({});
  h.retire.mockReset().mockResolvedValue(['plink_1']);
});

describe('POST /api/tasks/retire-payment-links', () => {
  it('401s on an invalid signature and retires nothing', async () => {
    h.verify.mockRejectedValue(new Error('bad signature'));
    expect((await POST(req())).status).toBe(401);
    expect(h.retire).not.toHaveBeenCalled();
  });

  it('retires links of closed events', async () => {
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect((await res.json()).retired).toEqual(['plink_1']);
  });

  it('500s so QStash retries when Stripe fails', async () => {
    h.retire.mockRejectedValue(new Error('stripe down'));
    expect((await POST(req())).status).toBe(500);
  });
});
