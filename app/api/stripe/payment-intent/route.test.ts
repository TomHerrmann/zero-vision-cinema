import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  findByID: vi.fn(),
  create: vi.fn(),
  retrieve: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/lib/stripe', () => ({
  stripeCheckout: {
    paymentIntents: { create: h.create, retrieve: h.retrieve, update: h.update },
  },
}));
vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ findByID: h.findByID }),
}));
vi.mock('@payload-config', () => ({ default: {} }));
vi.mock('@/lib/logtail', () => ({
  logtail: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { POST } from './route';

const req = (body: unknown) =>
  new Request('http://localhost/api/stripe/payment-intent', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest;

const inAWeek = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const event = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  name: 'Test Screening',
  eventType: 'zvc',
  price: 12,
  priceId: 'price_1',
  productId: 'prod_1',
  datetime: inAWeek(),
  ticketsSold: 0,
  location: { capacity: 50 },
  ...overrides,
});

beforeEach(() => {
  h.findByID.mockReset().mockResolvedValue(event());
  h.create.mockReset().mockImplementation(async (args) => ({
    id: 'pi_new',
    client_secret: 'secret_new',
    ...args,
  }));
  h.retrieve.mockReset();
  h.update.mockReset().mockImplementation(async (id, args) => ({
    id,
    client_secret: 'secret_existing',
    ...args,
  }));
});

describe('POST /api/stripe/payment-intent', () => {
  it('400s without an eventId', async () => {
    const res = await POST(req({}));
    expect(res.status).toBe(400);
    expect(h.create).not.toHaveBeenCalled();
  });

  it('prices tickets server-side from the event, in cents', async () => {
    const res = await POST(req({ eventId: 7, quantity: 3 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.amount).toBe(3600);
    expect(body.clientSecret).toBe('secret_new');
    expect(h.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 3600,
        currency: 'usd',
        metadata: expect.objectContaining({
          eventId: '7',
          quantity: '3',
          unit_price: '12',
          newsletter_optin: 'false',
        }),
      })
    );
  });

  it('ignores any price the client sends', async () => {
    await POST(req({ eventId: 7, quantity: 1, price: 0, amount: 1 }));
    expect(h.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 1200 }));
  });

  it('caps quantity at 5 per order', async () => {
    const res = await POST(req({ eventId: 7, quantity: 50 }));
    expect((await res.json()).maxQuantity).toBe(5);
    expect(h.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 6000 }));
  });

  it('caps quantity at the seats left', async () => {
    h.findByID.mockResolvedValue(event({ ticketsSold: 48 }));
    const res = await POST(req({ eventId: 7, quantity: 5 }));
    expect((await res.json()).maxQuantity).toBe(2);
    expect(h.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 2400 }));
  });

  it('treats a missing or bad quantity as 1', async () => {
    await POST(req({ eventId: 7, quantity: 'lots' }));
    expect(h.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 1200 }));
  });

  it('409s when the event is sold out', async () => {
    h.findByID.mockResolvedValue(event({ ticketsSold: 50 }));
    const res = await POST(req({ eventId: 7, quantity: 1 }));
    expect(res.status).toBe(409);
    expect(h.create).not.toHaveBeenCalled();
  });

  it('410s once ticket sales have closed', async () => {
    h.findByID.mockResolvedValue(
      event({ datetime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() })
    );
    const res = await POST(req({ eventId: 7, quantity: 1 }));
    expect(res.status).toBe(410);
    expect(h.create).not.toHaveBeenCalled();
  });

  it.each([
    ['free', { price: 0 }],
    ['missing a Stripe price', { priceId: null }],
    ['missing a Stripe product', { productId: null }],
  ])('400s for an event %s', async (_label, overrides) => {
    h.findByID.mockResolvedValue(event(overrides));
    const res = await POST(req({ eventId: 7, quantity: 1 }));
    expect(res.status).toBe(400);
    expect(h.create).not.toHaveBeenCalled();
  });

  it('records the newsletter opt-in in metadata', async () => {
    await POST(req({ eventId: 7, quantity: 1, newsletter: true }));
    expect(h.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ newsletter_optin: 'true' }),
      })
    );
  });

  it('updates an unpaid PaymentIntent instead of creating a new one', async () => {
    h.retrieve.mockResolvedValue({ id: 'pi_existing', status: 'requires_payment_method' });
    const res = await POST(
      req({ eventId: 7, quantity: 2, paymentIntentId: 'pi_existing' })
    );
    expect((await res.json()).clientSecret).toBe('secret_existing');
    expect(h.update).toHaveBeenCalledWith(
      'pi_existing',
      expect.objectContaining({ amount: 2400 })
    );
    expect(h.create).not.toHaveBeenCalled();
  });

  it('creates a fresh PaymentIntent if the old one is past payment', async () => {
    h.retrieve.mockResolvedValue({ id: 'pi_existing', status: 'succeeded' });
    await POST(req({ eventId: 7, quantity: 1, paymentIntentId: 'pi_existing' }));
    expect(h.update).not.toHaveBeenCalled();
    expect(h.create).toHaveBeenCalled();
  });

  it('500s without leaking details when Stripe fails', async () => {
    h.create.mockRejectedValue(new Error('stripe down sk_live_secret'));
    const res = await POST(req({ eventId: 7, quantity: 1 }));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('sk_live');
  });
});
