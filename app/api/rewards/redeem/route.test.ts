import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  listCustomers: vi.fn(),
  findByID: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  findUsableReward: vi.fn(),
  claimReward: vi.fn(),
  releaseRewardClaim: vi.fn(),
  enqueueTicketEmail: vi.fn(),
}));

vi.mock('@/lib/stripe', () => ({
  stripeCheckout: { customers: { list: h.listCustomers } },
}));
vi.mock('@/lib/loyalty', () => ({
  findUsableReward: h.findUsableReward,
  claimReward: h.claimReward,
  releaseRewardClaim: h.releaseRewardClaim,
}));
vi.mock('@/lib/tasks', () => ({ enqueueTicketEmail: h.enqueueTicketEmail }));
vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    findByID: h.findByID,
    create: h.create,
    update: h.update,
  }),
}));
vi.mock('@payload-config', () => ({ default: {} }));

import { NextRequest } from 'next/server';
import { POST } from './route';

const reward = { id: 5, code: 'ZVC-7K3Q-M9XA', customerId: 'cus_owner' };
const event = {
  id: 3,
  productId: 'prod_123',
  price: 13,
  ticketsSold: 4,
  location: { capacity: 50 },
};

const req = (body: Record<string, unknown>) =>
  new NextRequest('http://localhost/api/rewards/redeem', {
    method: 'POST',
    body: JSON.stringify(body),
  });

const valid = { eventId: 3, code: 'zvc-7k3q-m9xa', email: 'Buyer@Test.com' };

beforeEach(() => {
  h.listCustomers
    .mockReset()
    .mockImplementation(async ({ email }: { email: string }) => ({
      data: email === 'buyer@test.com' ? [{ id: 'cus_other' }, { id: 'cus_owner' }] : [],
    }));
  h.findByID.mockReset().mockResolvedValue(event);
  h.create.mockReset().mockResolvedValue({ id: 88 });
  h.update.mockReset().mockResolvedValue({});
  h.findUsableReward.mockReset().mockResolvedValue(reward);
  h.claimReward.mockReset().mockResolvedValue(true);
  h.releaseRewardClaim.mockReset().mockResolvedValue(undefined);
  h.enqueueTicketEmail.mockReset().mockResolvedValue(true);
});

describe('POST /api/rewards/redeem', () => {
  it('records a $0 order, counts the seat, and emails the ticket', async () => {
    const res = await POST(req(valid));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, orderId: 88 });
    expect(h.create).toHaveBeenCalledWith({
      collection: 'orders',
      data: expect.objectContaining({
        customerId: 'cus_owner',
        productId: 'prod_123',
        price: 13,
        amountPaid: 0,
        quantity: 1,
        item: { relationTo: 'events', value: 3 },
        redeemedReward: 5,
      }),
    });
    expect(h.update).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'rewards', id: 5, data: { redeemedOrder: 88 } })
    );
    expect(h.update).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'events', id: 3, data: { ticketsSold: 5 } })
    );
    expect(h.enqueueTicketEmail).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: 88, dedupKey: 'reward-5', email: 'Buyer@Test.com' })
    );
  });

  it('rejects an invalid, used, or expired code', async () => {
    h.findUsableReward.mockResolvedValue(null);

    const res = await POST(req(valid));

    expect(res.status).toBe(400);
    expect(h.create).not.toHaveBeenCalled();
  });

  it("rejects an email that isn't the code's owner", async () => {
    const res = await POST(req({ ...valid, email: 'friend@test.com' }));

    expect(res.status).toBe(403);
    expect(h.claimReward).not.toHaveBeenCalled();
    expect(h.create).not.toHaveBeenCalled();
  });

  it('rejects a sold-out event without spending the code', async () => {
    h.findByID.mockResolvedValue({ ...event, ticketsSold: 50 });

    const res = await POST(req(valid));

    expect(res.status).toBe(409);
    expect(h.claimReward).not.toHaveBeenCalled();
  });

  it('rejects a free event', async () => {
    h.findByID.mockResolvedValue({ ...event, price: 0 });

    const res = await POST(req(valid));

    expect(res.status).toBe(400);
    expect(h.claimReward).not.toHaveBeenCalled();
  });

  it('409s when a concurrent request already spent the code', async () => {
    h.claimReward.mockResolvedValue(false);

    const res = await POST(req(valid));

    expect(res.status).toBe(409);
    expect(h.create).not.toHaveBeenCalled();
  });

  it('gives the code back if the order cannot be recorded', async () => {
    h.create.mockRejectedValue(new Error('db down'));

    const res = await POST(req(valid));

    expect(res.status).toBe(500);
    expect(h.releaseRewardClaim).toHaveBeenCalledWith(expect.anything(), 5);
  });

  it('requires a code and email', async () => {
    const res = await POST(req({ eventId: 3, code: 'X' }));
    expect(res.status).toBe(400);
  });
});
