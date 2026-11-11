import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({ find: vi.fn(), movie: vi.fn() }));

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ find: h.find }),
}));
vi.mock('@payload-config', () => ({ default: {} }));
vi.mock('@/lib/omdb', () => ({ fetchMovieDataByImdbId: h.movie }));
vi.mock('@/app/(frontend)/halloweek2026/halloweek.data', () => ({
  HALLOWEEK_SCHEDULE: [
    {
      id: 'party',
      datetime: '2099-10-31T20:00:00-04:00',
      title: 'Halloween Party',
      description: 'Costumes.',
      venueName: 'The Bar',
    },
    {
      // Same minute as the Payload event below: the same night entered twice.
      id: 'dupe',
      datetime: '2099-10-28T19:30:00-04:00',
      title: 'Duplicate',
      description: '',
      venueName: 'The Bar',
    },
  ],
  HALLOWEEK_VENUES: [{ name: 'The Bar', address: '12-34 Broadway' }],
}));

import { GET } from './route';

const event = (over: Record<string, unknown>) => ({
  id: 1,
  name: 'The Thing',
  eventType: 'ahc',
  imdbId: 'tt0084787',
  price: 0,
  datetime: '2099-10-28T23:30:00.000Z',
  location: { name: 'The Bar', address: '12-34 Broadway' },
  ...over,
});

beforeEach(() => {
  h.movie.mockReset().mockResolvedValue({ year: '1982', runtime: '109 min' });
  h.find.mockReset().mockResolvedValue({
    docs: [
      event({}),
      event({ id: 2, name: 'Alien (1979)', eventType: 'zvc', price: 15, datetime: '2099-10-29T23:30:00.000Z' }),
      event({ id: 3, name: 'Bingo Night', eventType: 'bingo', imdbId: null, datetime: '2099-10-30T23:30:00.000Z' }),
    ],
  });
});

const summaries = async () =>
  [...(await (await GET()).text()).matchAll(/SUMMARY:(.*)\r\n/g)].map((m) =>
    m[1].replace(/\\,/g, ',')
  );

describe('GET /calendar.ics', () => {
  it('serves every published event as one subscribable calendar', async () => {
    const res = await GET();
    expect(res.headers.get('content-type')).toContain('text/calendar');
    expect(h.find.mock.calls[0][0].where._status).toEqual({ equals: 'published' });
    expect(h.find.mock.calls[0][0].where.eventType).toBeUndefined();
    expect(await res.text()).toContain('X-WR-CALNAME:Zero Vision Cinema Events');
  });

  it('titles events "Title (Year) | FREE | Series", FREE only at $0', async () => {
    expect(await summaries()).toEqual([
      'The Thing (1982) | FREE | Astoria Horror Club',
      'Alien (1979) | Zero Vision Cinema',
      'Bingo Night | FREE | Bingo',
      'Halloween Party | FREE | Halloweek',
    ]);
  });
});
