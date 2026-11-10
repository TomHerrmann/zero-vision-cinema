import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const h = vi.hoisted(() => ({
  verify: vi.fn(),
  find: vi.fn(),
  publishJSON: vi.fn(),
  retire: vi.fn(),
}));

vi.mock('@/lib/qstash', () => ({
  verifyQstashRequest: h.verify,
  qstash: { publishJSON: h.publishJSON },
  QSTASH_TARGET_BASE_URL: 'https://zerovisioncinema.com',
  QSTASH_DELIVERY_ENABLED: true,
}));
vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ find: h.find }),
}));
vi.mock('@payload-config', () => ({ default: {} }));
vi.mock('@/lib/retirePaymentLinks', () => ({
  retireClosedPaymentLinks: h.retire,
}));
vi.mock('@/lib/logtail', () => ({ logtail: { error: vi.fn() } }));

import { POST } from './route';

const req = () => new Request('http://localhost/api/tasks/send-due-broadcasts');

// 2026-08-19 09:00 ET, a Wednesday — a fixed "this morning" so the ET windows
// are stable.
const RUN_AT = new Date('2026-08-19T13:00:00.000Z');
// 2026-11-08 09:00 ET, a Sunday (after the clocks go back: 14:00Z).
const SUNDAY = new Date('2026-11-08T14:00:00.000Z');

/** Answer find() for today's events. */
function findReturns(today: unknown[]) {
  h.find.mockResolvedValueOnce({ docs: today });
}

beforeEach(() => {
  vi.useFakeTimers({ now: RUN_AT, toFake: ['Date'] });
  h.verify.mockReset().mockResolvedValue({});
  h.find.mockReset().mockResolvedValue({ docs: [] });
  h.publishJSON.mockReset().mockResolvedValue({ messageId: 'msg_1' });
  h.retire.mockReset().mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('POST /api/tasks/send-due-broadcasts', () => {
  it('401s on an invalid signature and queries nothing', async () => {
    h.verify.mockRejectedValue(new Error('bad signature'));
    const res = await POST(req());
    expect(res.status).toBe(401);
    expect(h.find).not.toHaveBeenCalled();
    expect(h.publishJSON).not.toHaveBeenCalled();
  });

  it('dispatches the weekly email on a Sunday', async () => {
    vi.setSystemTime(SUNDAY);
    const res = await POST(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.weekly).toBe('2026-11-08');
    expect(h.publishJSON).toHaveBeenCalledTimes(1);
    expect(h.publishJSON.mock.calls[0][0]).toMatchObject({
      url: 'https://zerovisioncinema.com/api/tasks/send-weekly-broadcast',
      body: {},
      failureCallback:
        'https://zerovisioncinema.com/api/tasks/send-weekly-broadcast/failure',
      deduplicationId: 'weekly-broadcast-20261108',
    });
    // A ':' makes publishJSON throw — QStash rejects it outright.
    expect(h.publishJSON.mock.calls[0][0].deduplicationId).not.toContain(':');
  });

  it('sends no event emails on other days, even with events today', async () => {
    findReturns([{ id: 7, datetime: '2026-08-19T23:30:00.000Z' }]);
    const body = await (await POST(req())).json();
    expect(body.weekly).toBeNull();
    expect(h.publishJSON).not.toHaveBeenCalled();
  });

  it("queries today's ET day for payment-link sweeps", async () => {
    await POST(req());
    expect(h.find).toHaveBeenCalledTimes(1);
    expect(h.find.mock.calls[0][0].where.datetime).toEqual({
      greater_than_equal: '2026-08-19T04:00:00.000Z',
      less_than: '2026-08-20T04:00:00.000Z',
    });
    expect(h.find.mock.calls[0][0].where._status).toEqual({
      equals: 'published',
    });
  });

  it('500s so QStash retries when the lookup fails', async () => {
    h.find.mockReset().mockRejectedValue(new Error('db down'));
    const res = await POST(req());
    expect(res.status).toBe(500);
  });

  it('retires past payment links on the same run', async () => {
    h.retire.mockResolvedValue(['plink_1', 'plink_2']);
    const body = await (await POST(req())).json();
    expect(h.retire).toHaveBeenCalledWith(expect.anything(), RUN_AT);
    expect(body.retiredPaymentLinks).toBe(2);
  });

  it('still 200s when retiring links fails, so the weekly email is not re-sent', async () => {
    vi.setSystemTime(SUNDAY);
    h.retire.mockRejectedValue(new Error('stripe down'));
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect((await res.json()).weekly).toBe('2026-11-08');
  });

  it("schedules a link retirement for when each of today's events closes", async () => {
    // 7:30pm ET tonight → sales close 8:30pm ET (00:30Z).
    findReturns([
      {
        id: 7,
        datetime: '2026-08-19T23:30:00.000Z',
        paymentLink: 'https://buy.stripe.com/a',
      },
      // Free events have no link to retire.
      { id: 8, datetime: '2026-08-19T23:00:00.000Z' },
    ]);
    const body = await (await POST(req())).json();

    expect(body.scheduledRetirements).toBe(1);
    expect(h.publishJSON).toHaveBeenCalledTimes(1);
    const closesAt = Date.parse('2026-08-20T00:30:00.000Z');
    expect(h.publishJSON.mock.calls[0][0]).toMatchObject({
      url: 'https://zerovisioncinema.com/api/tasks/retire-payment-links',
      notBefore: closesAt / 1000,
      deduplicationId: `retire-links-7-${closesAt}`,
    });
  });
});
