import { describe, it, expect, vi, beforeEach } from 'vitest';

// Hoisted spies shared between the module mocks and the assertions.
const h = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  retrievePi: vi.fn(),
  retrieveCustomer: vi.fn(),
  listCustomers: vi.fn(),
  createCustomer: vi.fn(),
  find: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  publishJSON: vi.fn(),
  addResendContact: vi.fn(),
}));

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers({ 'stripe-signature': 'sig' })),
}));
vi.mock('@/lib/stripe', () => ({
  stripe: { webhooks: { constructEvent: h.constructEvent } },
  stripeCheckout: {
    paymentIntents: { retrieve: h.retrievePi },
    customers: {
      retrieve: h.retrieveCustomer,
      list: h.listCustomers,
      create: h.createCustomer,
    },
  },
}));
vi.mock('@/lib/qstash', () => ({
  qstash: { publishJSON: h.publishJSON },
  QSTASH_TARGET_BASE_URL: 'https://zvc.test',
}));
vi.mock('@/lib/resend', () => ({ addResendContact: h.addResendContact }));
vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    find: h.find,
    create: h.create,
    update: h.update,
  }),
}));
vi.mock('@payload-config', () => ({ default: {} }));

import { POST } from './route';

const PI_ID = 'pi_123';

const paymentIntent = {
  id: PI_ID,
  metadata: { productId: 'prod_123', quantity: '2', unit_price: '10' },
  created: 1_754_000_000,
  amount_received: 2000,
  customer: 'cus_123',
  latest_charge: {
    receipt_url: 'https://receipt',
    billing_details: { email: 'buyer@test.com', name: 'A Buyer' },
  },
};

const event_ = { id: 3, productId: 'prod_123', ticketsSold: 4 };

// The route reads the body only through the mocked constructEvent, so a bare
// request is fine; what constructEvent returns is what drives the handler.
const req = () =>
  new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body: '{}',
  });

/** An order as the duplicate branch reads it back (depth 0). */
const existing = (over: Record<string, unknown> = {}) => ({
  id: 42,
  paymentIntentId: PI_ID,
  ticketEmailSentAt: null,
  refundedAt: null,
  item: { relationTo: 'events', value: 3 },
  ...over,
});

/**
 * `find` is called for orders, then events, then (only for non-events) merch.
 * Queue the docs each call should return, in order.
 */
const findReturns = (...docs: unknown[][]) => {
  h.find.mockReset();
  for (const d of docs) h.find.mockResolvedValueOnce({ docs: d });
  h.find.mockResolvedValue({ docs: [] });
};

beforeEach(() => {
  h.constructEvent
    .mockReset()
    .mockReturnValue({
      type: 'payment_intent.succeeded',
      data: { object: paymentIntent },
    });
  h.retrievePi.mockReset().mockResolvedValue(paymentIntent);
  h.retrieveCustomer.mockReset().mockResolvedValue({ id: 'cus_123', email: null });
  h.listCustomers.mockReset().mockResolvedValue({ data: [] });
  h.createCustomer.mockReset().mockResolvedValue({ id: 'cus_123' });
  h.create.mockReset().mockResolvedValue({ id: 42 });
  h.update.mockReset().mockResolvedValue({});
  h.publishJSON.mockReset().mockResolvedValue({ messageId: 'msg_1' });
  h.addResendContact.mockReset().mockResolvedValue(undefined);
  // Default: no existing order, and the product is an event.
  findReturns([], [event_]);
});

describe('stripe webhook — payment_intent.succeeded', () => {
  it('records the order and enqueues the ticket email', async () => {
    const res = await POST(req());

    expect(res.status).toBe(200);
    expect(h.create).toHaveBeenCalledTimes(1);
    expect(h.publishJSON).toHaveBeenCalledTimes(1);
    expect(h.publishJSON.mock.calls[0][0]).toMatchObject({
      url: 'https://zvc.test/api/tasks/send-ticket-email',
      body: { orderId: 42, email: 'buyer@test.com' },
      deduplicationId: `ticket-email-${PI_ID}`,
    });
  });

  it('500s after a failed enqueue so Stripe redelivers — but still counts the seat', async () => {
    h.publishJSON.mockRejectedValue(new Error('invalid token'));

    const res = await POST(req());

    expect(res.status).toBe(500);
    // The order is recorded and the seat counted; only the email is outstanding.
    expect(h.create).toHaveBeenCalledTimes(1);
    expect(h.update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'events',
        id: 3,
        data: { ticketsSold: 6 },
      })
    );
  });

  it('re-enqueues on redelivery when the recorded order was never emailed', async () => {
    findReturns([existing()]);

    const res = await POST(req());

    expect(res.status).toBe(200);
    // Repaired, not duplicated: no second order, no second seat.
    expect(h.create).not.toHaveBeenCalled();
    expect(h.update).not.toHaveBeenCalled();
    expect(h.publishJSON).toHaveBeenCalledTimes(1);
    expect(h.publishJSON.mock.calls[0][0]).toMatchObject({
      body: { orderId: 42 },
      deduplicationId: `ticket-email-${PI_ID}`,
    });
  });

  it('500s on redelivery when the re-enqueue also fails, so Stripe tries again', async () => {
    findReturns([existing()]);
    h.publishJSON.mockRejectedValue(new Error('invalid token'));

    const res = await POST(req());

    expect(res.status).toBe(500);
    expect(h.create).not.toHaveBeenCalled();
  });

  it('ignores a redelivery whose order was already emailed', async () => {
    findReturns([existing({ ticketEmailSentAt: '2026-09-01T00:00:00.000Z' })]);

    const res = await POST(req());

    expect(res.status).toBe(200);
    expect(h.publishJSON).not.toHaveBeenCalled();
    expect(h.create).not.toHaveBeenCalled();
  });

  it('ignores a redelivery for a refunded order', async () => {
    findReturns([existing({ refundedAt: '2026-09-01T00:00:00.000Z' })]);

    const res = await POST(req());

    expect(res.status).toBe(200);
    expect(h.publishJSON).not.toHaveBeenCalled();
  });

  it('ignores a redelivery for a merch order — there is no ticket to send', async () => {
    findReturns([existing({ item: { relationTo: 'merch', value: 9 } })]);

    const res = await POST(req());

    expect(res.status).toBe(200);
    expect(h.publishJSON).not.toHaveBeenCalled();
  });
});
