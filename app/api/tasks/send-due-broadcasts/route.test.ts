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

// 2026-08-19 09:00 ET — a fixed "this morning" so the ET windows are stable.
const RUN_AT = new Date('2026-08-19T13:00:00.000Z');

/** Answer find() per window: today's events first, then the +6d events. */
function findReturns(today: unknown[], inSixDays: unknown[]) {
  h.find
    .mockResolvedValueOnce({ docs: today })
    .mockResolvedValueOnce({ docs: inSixDays });
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

  it('dispatches a reminder for an event happening today', async () => {
    findReturns([{ id: 7, reminderSentAt: null }], []);

    const res = await POST(req());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.dispatched).toBe(1);
    expect(h.publishJSON).toHaveBeenCalledTimes(1);
    expect(h.publishJSON.mock.calls[0][0]).toMatchObject({
      url: 'https://zerovisioncinema.com/api/tasks/send-broadcast',
      body: { eventId: 7, kind: 'reminder' },
      failureCallback:
        'https://zerovisioncinema.com/api/tasks/send-broadcast/failure',
    });
  });

  it('dispatches an announcement for an event six days out', async () => {
    findReturns([], [{ id: 9, announcementSentAt: null }]);

    const body = await (await POST(req())).json();

    expect(body.dispatched).toBe(1);
    expect(h.publishJSON.mock.calls[0][0]).toMatchObject({
      body: { eventId: 9, kind: 'announcement' },
    });
  });

  it('queries the right ET day for each kind', async () => {
    await POST(req());

    // Reminder window = today in ET; announcement window = today + 6 days.
    expect(h.find.mock.calls[0][0].where.datetime).toEqual({
      greater_than_equal: '2026-08-19T04:00:00.000Z',
      less_than: '2026-08-20T04:00:00.000Z',
    });
    expect(h.find.mock.calls[1][0].where.datetime).toEqual({
      greater_than_equal: '2026-08-25T04:00:00.000Z',
      less_than: '2026-08-26T04:00:00.000Z',
    });
    expect(h.find.mock.calls[0][0].where._status).toEqual({
      equals: 'published',
    });
  });

  it('skips an event whose broadcast already went out', async () => {
    findReturns([{ id: 7, reminderSentAt: '2026-08-19T13:00:00.000Z' }], []);

    const body = await (await POST(req())).json();

    expect(body.dispatched).toBe(0);
    expect(body.skipped).toBe(1);
    expect(h.publishJSON).not.toHaveBeenCalled();
  });

  it('dispatches nothing on a day with no due events', async () => {
    const body = await (await POST(req())).json();
    expect(body.dispatched).toBe(0);
    expect(h.publishJSON).not.toHaveBeenCalled();
  });

  it('uses a per-event-per-day deduplicationId with no colons', async () => {
    findReturns([{ id: 7, reminderSentAt: null }], []);

    await POST(req());

    const { deduplicationId } = h.publishJSON.mock.calls[0][0];
    expect(deduplicationId).toBe('broadcast-7-reminder-20260819');
    // A ':' makes publishJSON throw — QStash rejects it outright.
    expect(deduplicationId).not.toContain(':');
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

  it('still 200s when retiring links fails, so broadcasts are not re-sent', async () => {
    findReturns([{ id: 7, reminderSentAt: null }], []);
    h.retire.mockRejectedValue(new Error('stripe down'));
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect((await res.json()).dispatched).toBe(1);
  });

  it('schedules a link retirement for when each of today\'s events closes', async () => {
    // 7:30pm ET tonight → sales close 8:30pm ET (00:30Z).
    findReturns(
      [
        {
          id: 7,
          datetime: '2026-08-19T23:30:00.000Z',
          paymentLink: 'https://buy.stripe.com/a',
          reminderSentAt: '2026-08-19T13:00:00.000Z',
        },
        // Free events have no link to retire.
        { id: 8, datetime: '2026-08-19T23:00:00.000Z', reminderSentAt: 'x' },
      ],
      []
    );
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
