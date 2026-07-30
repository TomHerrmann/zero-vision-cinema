import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted spies shared between the module mocks and the assertions.
const h = vi.hoisted(() => ({
  verify: vi.fn(),
  findByID: vi.fn(),
  find: vi.fn(),
  update: vi.fn().mockResolvedValue({}),
  send: vi.fn(),
  fetchMovie: vi.fn(),
  getReceipt: vi.fn(),
}));

vi.mock('@/lib/qstash', () => ({
  verifyQstashRequest: h.verify,
  qstash: {},
  QSTASH_TARGET_BASE_URL: '',
}));
vi.mock('@/lib/stripe', () => ({ getReceiptDetails: h.getReceipt }));
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
vi.mock('@/lib/omdb', () => ({ fetchMovieDataByImdbId: h.fetchMovie }));
vi.mock('@/emails/TicketEmail', () => ({ default: () => null }));

import { POST } from './route';

const order = {
  id: 7,
  productId: 'prod_123',
  quantity: 2,
  amountPaid: 20,
  transactionDate: '2026-07-29T00:00:00.000Z',
  ticketEmailSentAt: null as string | null,
};

const event = {
  id: 3,
  productId: 'prod_123',
  name: 'The Thing',
  datetime: '2026-08-01T23:00:00.000Z',
  image: null,
  imdbId: null,
  description: null,
  location: { name: 'SingleCut', address: '19-33 37th St' },
};

// The route reads the request only through the mocked verifyQstashRequest, so a
// bare Request is fine; the body it returns is what drives the handler.
const req = () => new Request('http://localhost/api/tasks/send-ticket-email');

beforeEach(() => {
  h.verify.mockReset().mockResolvedValue({ orderId: 7, email: 'buyer@test.com' });
  h.findByID.mockReset().mockResolvedValue({ ...order });
  h.find.mockReset().mockResolvedValue({ docs: [event] });
  h.update.mockReset().mockResolvedValue({});
  h.send.mockReset().mockResolvedValue({ data: { id: 'email_1' }, error: null });
  h.fetchMovie.mockReset().mockResolvedValue(null);
  h.getReceipt.mockReset().mockResolvedValue({
    cardBrand: 'Visa',
    cardLast4: '4242',
    currency: 'USD',
    receiptUrl: 'https://receipt',
  });
});

describe('send-ticket-email task', () => {
  it('skips (no send) when the order was already emailed — idempotent redelivery', async () => {
    h.findByID.mockResolvedValue({ ...order, ticketEmailSentAt: '2026-07-29T01:00:00.000Z' });

    const res = await POST(req());

    expect(res.status).toBe(200);
    expect(h.send).not.toHaveBeenCalled();
    expect(h.update).not.toHaveBeenCalled();
  });

  it('sends the email and stamps ticketEmailSentAt on success', async () => {
    const res = await POST(req());

    expect(res.status).toBe(200);
    expect(h.send).toHaveBeenCalledTimes(1);
    expect(h.send.mock.calls[0][0]).toMatchObject({ to: 'buyer@test.com' });
    expect(h.update).toHaveBeenCalledTimes(1);
    expect(h.update.mock.calls[0][0].data).toHaveProperty('ticketEmailSentAt');
  });

  it('returns 500 (so QStash retries) and does not stamp when Resend fails', async () => {
    h.send.mockResolvedValue({ data: null, error: { message: 'rate limited' } });

    const res = await POST(req());

    expect(res.status).toBe(500);
    expect(h.update).not.toHaveBeenCalled();
  });

  it('401s on an invalid QStash signature without touching the DB', async () => {
    h.verify.mockRejectedValue(new Error('Invalid Upstash signature'));

    const res = await POST(req());

    expect(res.status).toBe(401);
    expect(h.findByID).not.toHaveBeenCalled();
    expect(h.send).not.toHaveBeenCalled();
  });
});
