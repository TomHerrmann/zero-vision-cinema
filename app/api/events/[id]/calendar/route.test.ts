import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ find: vi.fn(), runtime: vi.fn() }));

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ find: h.find }),
}));
vi.mock('@payload-config', () => ({ default: {} }));
vi.mock('@/lib/eventRuntime', () => ({ getEventRuntimeMinutes: h.runtime }));

import { GET } from './route';

const call = (id: string, query = '') =>
  GET(new Request(`http://localhost/api/events/${id}/calendar${query}`), {
    params: Promise.resolve({ id }),
  });

const screening = {
  id: 10,
  name: 'The Evil Dead (1981)',
  eventType: 'zvc',
  imdbId: 'tt0083907',
  datetime: '2026-10-03T23:30:00.000Z',
  location: { name: 'The Bar', address: '12-34 Broadway' },
};

beforeEach(() => {
  h.find.mockReset().mockResolvedValue({ docs: [screening] });
  h.runtime.mockReset().mockResolvedValue(85);
});

describe('GET /api/events/[id]/calendar', () => {
  it('serves an .ics ending 15 minutes + runtime after the start', async () => {
    const res = await call('10');
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/calendar');
    const ics = await res.text();
    // 7:30pm + 15 + 85 = 9:10pm ET.
    expect(ics).toContain('DTEND:20261004T011000Z');
    expect(ics).toContain('LOCATION:The Bar\\, 12-34 Broadway');
    expect(ics).toContain('URL:https://zerovisioncinema.com/events/10');
  });

  it('redirects to Google Calendar with ?format=google', async () => {
    const res = await call('10', '?format=google');
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toContain(
      'https://calendar.google.com/calendar/render?'
    );
  });

  it('links free events to the Astoria Horror Club page', async () => {
    h.find.mockResolvedValue({
      docs: [{ ...screening, eventType: 'bookclub', imdbId: null }],
    });
    const ics = await (await call('10')).text();
    expect(ics).toContain('URL:https://zerovisioncinema.com/astoriahorrorclub');
  });

  it('404s an unknown or malformed id', async () => {
    h.find.mockResolvedValue({ docs: [] });
    expect((await call('99')).status).toBe(404);
    expect((await call('abc')).status).toBe(404);
  });
});
