import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  find: vi.fn(),
  runtime: vi.fn(),
  movie: vi.fn(),
  book: vi.fn(),
  bookSearch: vi.fn(),
}));

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ find: h.find }),
}));
vi.mock('@payload-config', () => ({ default: {} }));
vi.mock('@/lib/eventRuntime', () => ({ getEventRuntimeMinutes: h.runtime }));
vi.mock('@/lib/omdb', () => ({ fetchMovieDataByImdbId: h.movie }));
vi.mock('@/lib/openlibrary', () => ({
  fetchBookDataByOpenLibraryId: h.book,
  searchBookByTitleAuthor: h.bookSearch,
}));

import { GET } from './route';

const paragraph = (text: string) => ({
  type: 'paragraph',
  children: [{ type: 'text', text }],
});

const screening = {
  id: 10,
  name: 'The Evil Dead (1981)',
  eventType: 'zvc',
  imdbId: 'tt0083907',
  datetime: '2026-10-03T23:30:00.000Z',
  price: 15,
  paymentLink: 'https://buy.stripe.com/abc',
  image: { url: '/api/media/file/evil-dead.jpg', alt: 'Evil Dead' },
  location: {
    name: 'The Bar',
    address: '12-34 Broadway',
    city: 'Astoria',
    state: 'NY',
    zip: 11106,
    url: 'https://thebar.example',
  },
  description: {
    root: { children: [paragraph('Groovy.'), paragraph('Bring a chainsaw.')] },
  },
  updatedAt: '2026-10-01T12:00:00.000Z',
};

const feed = async () => (await (await GET()).json()).events;

beforeEach(() => {
  h.find.mockReset().mockResolvedValue({ docs: [screening] });
  h.runtime.mockReset().mockResolvedValue(85);
  h.movie.mockReset().mockResolvedValue({ plot: 'OMDB plot', poster: 'https://omdb/p.jpg' });
  h.book.mockReset().mockResolvedValue({ description: 'Book blurb', cover: 'https://ol/c.jpg' });
  h.bookSearch.mockReset().mockResolvedValue(null);
});

describe('GET /api/events/feed', () => {
  it('lists published events of every type, starting up to a day ago', async () => {
    await GET();
    const where = h.find.mock.calls[0][0].where;
    expect(where._status).toEqual({ equals: 'published' });
    expect(where.eventType).toBeUndefined();
    expect(where.datetime.greater_than).toBeDefined();
  });

  it('returns the listing fields with the description as written', async () => {
    const [event] = await feed();
    expect(event).toMatchObject({
      id: 10,
      eventTypeName: 'Zero Vision Cinema',
      timeZone: 'America/New_York',
      date: '2026-10-03',
      start: '2026-10-03T19:30:00-04:00',
      // 7:30pm + 15 + 85 = 9:10pm ET.
      end: '2026-10-03T21:10:00-04:00',
      startLabel: 'Saturday, October 3, 2026, 7:30 PM ET',
      endLabel: '9:10 PM ET',
      description: 'Groovy.\n\nBring a chainsaw.',
      posterUrl: 'https://zerovisioncinema.com/api/media/file/evil-dead.jpg',
      eventUrl: 'https://zerovisioncinema.com/events/10',
      ticketUrl: 'https://buy.stripe.com/abc',
      venue: { name: 'The Bar', address: '12-34 Broadway' },
    });
    expect(h.movie).not.toHaveBeenCalled();
  });

  it('gives times in New York time, with the winter offset after DST ends', async () => {
    // 11pm ET on Nov 30 is 4am UTC on Dec 1: the date must stay the 30th.
    h.find.mockResolvedValue({
      docs: [{ ...screening, datetime: '2026-12-01T04:00:00.000Z' }],
    });
    const [event] = await feed();
    expect(event.date).toBe('2026-11-30');
    expect(event.start).toBe('2026-11-30T23:00:00-05:00');
    expect(event.startLabel).toBe('Monday, November 30, 2026, 11:00 PM ET');
    expect(new Date(event.start).toISOString()).toBe('2026-12-01T04:00:00.000Z');
  });

  it('falls back to the OMDB poster and plot like the event card', async () => {
    h.find.mockResolvedValue({
      docs: [{ ...screening, image: null, description: null }],
    });
    const [event] = await feed();
    expect(event.posterUrl).toBe('https://omdb/p.jpg');
    expect(event.description).toBe('OMDB plot');
  });

  it('falls back to the Open Library cover and blurb for book club', async () => {
    h.find.mockResolvedValue({
      docs: [
        {
          ...screening,
          eventType: 'bookclub',
          imdbId: null,
          openLibraryId: 'OL1W',
          image: null,
          description: null,
          price: 0,
          paymentLink: null,
        },
      ],
    });
    const [event] = await feed();
    expect(event.posterUrl).toBe('https://ol/c.jpg');
    expect(event.description).toBe('Book blurb');
    expect(event.eventUrl).toBe('https://zerovisioncinema.com/astoriahorrorclub');
    expect(event.ticketUrl).toBeNull();
  });
});
