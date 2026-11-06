import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  auth: vi.fn(),
  findByID: vi.fn(),
  find: vi.fn(),
  retrieveCustomer: vi.fn(),
}));

vi.mock('@/lib/stripe', () => ({
  stripe: { customers: { retrieve: h.retrieveCustomer } },
}));
vi.mock('@/lib/logtail', () => ({
  logtail: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));
vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    auth: h.auth,
    findByID: h.findByID,
    find: h.find,
  }),
}));
vi.mock('@/payload.config', () => ({ default: {} }));

import { NextRequest } from 'next/server';
import { GET } from './route';

const req = () =>
  new NextRequest('http://localhost/api/attendees?eventid=3');

describe('GET /api/attendees', () => {
  beforeEach(() => vi.clearAllMocks());

  it('401s without a logged-in admin and never touches Stripe', async () => {
    h.auth.mockResolvedValue({ user: null });

    const res = await GET(req());

    expect(res.status).toBe(401);
    expect(h.findByID).not.toHaveBeenCalled();
    expect(h.retrieveCustomer).not.toHaveBeenCalled();
  });

  it('returns the roster for a logged-in admin', async () => {
    h.auth.mockResolvedValue({ user: { id: 1 } });
    h.findByID.mockResolvedValue({ id: 3, name: 'Test', productId: 'prod_1' });
    h.find.mockResolvedValue({
      docs: [{ customerId: 'cus_1', quantity: 2, createdAt: '2026-11-01' }],
    });
    h.retrieveCustomer.mockResolvedValue({
      id: 'cus_1',
      name: 'A',
      email: 'a@example.com',
    });

    const res = await GET(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.attendees).toHaveLength(2);
  });
});
