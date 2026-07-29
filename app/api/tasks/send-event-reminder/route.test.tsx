import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  verify: vi.fn(),
  findByID: vi.fn(),
  find: vi.fn(),
  update: vi.fn().mockResolvedValue({}),
  send: vi.fn(),
  fetchMovie: vi.fn(),
  getEmail: vi.fn(),
}));

vi.mock('@/lib/qstash', () => ({
  verifyQstashRequest: h.verify,
  qstash: {},
  QSTASH_TARGET_BASE_URL: '',
}));
vi.mock('@/lib/stripe', () => ({ getCustomerEmail: h.getEmail }));
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
vi.mock('@/emails/EventReminderEmail', () => ({ default: () => null }));

import { POST } from './route';

const futureIso = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString();

const baseOrder = {
  id: 7,
  productId: 'prod_123',
  customerId: 'cus_123',
  quantity: 1,
  preEventEmailSentAt: null as string | null,
  dayOfEmailSentAt: null as string | null,
  refundedAt: null as string | null,
};

const event = {
  id: 3,
  productId: 'prod_123',
  name: 'The Thing',
  datetime: futureIso,
  image: null,
  imdbId: null,
  location: { name: 'SingleCut', address: '19-33 37th St' },
};

const req = () => new Request('http://localhost/api/tasks/send-event-reminder');

beforeEach(() => {
  h.verify.mockReset().mockResolvedValue({ orderId: 7, kind: 'pre-event' });
  h.findByID.mockReset().mockResolvedValue({ ...baseOrder });
  h.find.mockReset().mockResolvedValue({ docs: [event] });
  h.update.mockReset().mockResolvedValue({});
  h.send.mockReset().mockResolvedValue({ data: { id: 'e1' }, error: null });
  h.fetchMovie.mockReset().mockResolvedValue(null);
  h.getEmail.mockReset().mockResolvedValue('buyer@test.com');
});

describe('send-event-reminder task', () => {
  it('401s on invalid signature without touching the DB', async () => {
    h.verify.mockRejectedValue(new Error('bad sig'));
    const res = await POST(req());
    expect(res.status).toBe(401);
    expect(h.findByID).not.toHaveBeenCalled();
  });

  it('400s on a bad payload (missing/invalid kind)', async () => {
    h.verify.mockResolvedValue({ orderId: 7 });
    const res = await POST(req());
    expect(res.status).toBe(400);
  });

  it('skips (no send) when that reminder was already sent', async () => {
    h.findByID.mockResolvedValue({ ...baseOrder, preEventEmailSentAt: '2026-01-01T00:00:00Z' });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.send).not.toHaveBeenCalled();
    expect(h.update).not.toHaveBeenCalled();
  });

  it('skips (no send) when the order was refunded', async () => {
    h.findByID.mockResolvedValue({ ...baseOrder, refundedAt: '2026-01-01T00:00:00Z' });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.send).not.toHaveBeenCalled();
  });

  it('sends the pre-event email and stamps preEventEmailSentAt', async () => {
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.send).toHaveBeenCalledTimes(1);
    expect(h.send.mock.calls[0][0]).toMatchObject({ to: 'buyer@test.com' });
    expect(h.update.mock.calls[0][0].data).toHaveProperty('preEventEmailSentAt');
  });

  it('stamps dayOfEmailSentAt for the day-of kind', async () => {
    h.verify.mockResolvedValue({ orderId: 7, kind: 'day-of' });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.update.mock.calls[0][0].data).toHaveProperty('dayOfEmailSentAt');
  });

  it('marks done (no send) when the event is already over', async () => {
    h.find.mockResolvedValue({
      docs: [{ ...event, datetime: new Date(Date.now() - 1000).toISOString() }],
    });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.send).not.toHaveBeenCalled();
    expect(h.update.mock.calls[0][0].data).toHaveProperty('preEventEmailSentAt');
  });

  it('marks done (no send) when the Stripe customer has no email', async () => {
    h.getEmail.mockResolvedValue(null);
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.send).not.toHaveBeenCalled();
    expect(h.update.mock.calls[0][0].data).toHaveProperty('preEventEmailSentAt');
  });

  it('returns 500 (so QStash retries) and does not stamp when Resend fails', async () => {
    h.send.mockResolvedValue({ data: null, error: { message: 'rate limited' } });
    const res = await POST(req());
    expect(res.status).toBe(500);
    expect(h.update).not.toHaveBeenCalled();
  });
});
