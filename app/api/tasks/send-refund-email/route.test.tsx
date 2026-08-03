import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  verify: vi.fn(),
  findByID: vi.fn(),
  find: vi.fn(),
  update: vi.fn().mockResolvedValue({}),
  send: vi.fn(),
  getEmail: vi.fn(),
  getReceipt: vi.fn(),
}));

vi.mock('@/lib/qstash', () => ({ verifyQstashRequest: h.verify }));
vi.mock('@/lib/stripe', () => ({
  getCustomerEmail: h.getEmail,
  getReceiptDetails: h.getReceipt,
}));
vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    findByID: h.findByID,
    find: h.find,
    update: h.update,
  }),
}));
vi.mock('@payload-config', () => ({ default: {} }));
vi.mock('resend', () => ({
  Resend: class {
    emails = { send: h.send };
  },
}));
vi.mock('@/emails/RefundEmail', () => ({ default: () => null }));

import { POST } from './route';

const order = {
  id: 9,
  productId: 'prod_1',
  customerId: 'cus_1',
  amountPaid: 10,
  receiptUrl: 'https://receipt',
  paymentIntentId: 'pi_1',
  refundedAt: '2026-01-01T00:00:00Z',
  refundEmailSentAt: null as string | null,
};
const event = { id: 1, productId: 'prod_1', name: 'The Thing', datetime: '2026-08-01T23:00:00Z' };
const req = () => new Request('http://localhost/api/tasks/send-refund-email');

beforeEach(() => {
  h.verify.mockReset().mockResolvedValue({ orderId: 9 });
  h.findByID.mockReset().mockResolvedValue({ ...order });
  h.find.mockReset().mockResolvedValue({ docs: [event] });
  h.update.mockReset().mockResolvedValue({});
  h.send.mockReset().mockResolvedValue({ data: { id: 'e1' }, error: null });
  h.getEmail.mockReset().mockResolvedValue('buyer@test.com');
  h.getReceipt.mockReset().mockResolvedValue({
    cardBrand: 'Visa',
    cardLast4: '4242',
    currency: 'USD',
    receiptUrl: 'https://receipt',
  });
});

describe('send-refund-email task', () => {
  it('401s on invalid signature', async () => {
    h.verify.mockRejectedValue(new Error('bad'));
    expect((await POST(req())).status).toBe(401);
  });

  it('400s without an orderId', async () => {
    h.verify.mockResolvedValue({});
    expect((await POST(req())).status).toBe(400);
  });

  it('skips when the refund email was already sent', async () => {
    h.findByID.mockResolvedValue({ ...order, refundEmailSentAt: '2026-01-02T00:00:00Z' });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.send).not.toHaveBeenCalled();
  });

  it('marks done (no send) when the Stripe customer has no email', async () => {
    h.getEmail.mockResolvedValue(null);
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.send).not.toHaveBeenCalled();
    expect(h.update.mock.calls[0][0].data).toHaveProperty('refundEmailSentAt');
  });

  it('sends the refund email and stamps refundEmailSentAt', async () => {
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.send).toHaveBeenCalledTimes(1);
    expect(h.send.mock.calls[0][0]).toMatchObject({ to: 'buyer@test.com' });
    expect(h.update.mock.calls[0][0].data).toHaveProperty('refundEmailSentAt');
  });

  it('returns 500 (retry) and does not stamp when Resend fails', async () => {
    h.send.mockResolvedValue({ data: null, error: { message: 'boom' } });
    const res = await POST(req());
    expect(res.status).toBe(500);
    expect(h.update).not.toHaveBeenCalled();
  });
});
