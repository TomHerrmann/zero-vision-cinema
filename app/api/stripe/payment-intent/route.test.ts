import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  findByID: vi.fn(),
  create: vi.fn(),
  retrieve: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripeCheckout: {
    paymentIntents: {
      create: h.create,
      retrieve: h.retrieve,
      update: h.update,
    },
  },
}));
vi.mock("payload", () => ({
  getPayload: vi.fn().mockResolvedValue({ findByID: h.findByID }),
}));
vi.mock("@payload-config", () => ({ default: {} }));
vi.mock("@/lib/logtail", () => ({
  logtail: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { GET, POST } from "./route";

const farFuture = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

const event = {
  id: 44,
  name: "Night of the Demons",
  price: 10,
  priceId: "price_1",
  productId: "prod_1",
  datetime: farFuture,
  ticketsSold: 47,
  location: { capacity: 50 },
};

const get = (eventId: number) =>
  GET(
    new NextRequest(
      `http://localhost/api/stripe/payment-intent?eventId=${eventId}`,
    ),
  );
const post = (body: unknown) =>
  POST({ json: async () => body } as unknown as NextRequest);

beforeEach(() => {
  h.findByID.mockReset().mockResolvedValue({ ...event });
  h.create
    .mockReset()
    .mockResolvedValue({ id: "pi_new", client_secret: "cs_new" });
  h.retrieve.mockReset();
  h.update.mockReset();
});

describe("GET /api/stripe/payment-intent", () => {
  it("returns the price and ticket limit without touching Stripe", async () => {
    const res = await get(44);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ unitAmount: 1000, maxQuantity: 3 });
    expect(h.create).not.toHaveBeenCalled();
  });

  it("409s when the event is sold out", async () => {
    h.findByID.mockResolvedValue({ ...event, ticketsSold: 50 });
    const res = await get(44);
    expect(res.status).toBe(409);
  });
});

describe("POST /api/stripe/payment-intent", () => {
  it("creates the PaymentIntent with the server-side amount", async () => {
    const res = await post({ eventId: 44, quantity: 2, newsletter: true });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      clientSecret: "cs_new",
      paymentIntentId: "pi_new",
    });
    expect(h.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 2000,
        metadata: expect.objectContaining({
          productId: "prod_1",
          quantity: "2",
          newsletter_optin: "true",
        }),
      }),
    );
  });

  it("refuses more tickets than are left instead of charging a different amount", async () => {
    const res = await post({ eventId: 44, quantity: 5 });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({
      error: "Only 3 tickets left.",
      maxQuantity: 3,
    });
    expect(h.create).not.toHaveBeenCalled();
  });

  it("reuses the PaymentIntent from a failed attempt", async () => {
    h.retrieve.mockResolvedValue({ status: "requires_payment_method" });
    h.update.mockResolvedValue({ id: "pi_old", client_secret: "cs_old" });
    const res = await post({
      eventId: 44,
      quantity: 1,
      paymentIntentId: "pi_old",
    });
    expect(await res.json()).toEqual({
      clientSecret: "cs_old",
      paymentIntentId: "pi_old",
    });
    expect(h.update).toHaveBeenCalledWith(
      "pi_old",
      expect.objectContaining({ amount: 1000 }),
    );
    expect(h.create).not.toHaveBeenCalled();
  });
});
