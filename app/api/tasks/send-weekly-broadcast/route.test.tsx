import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const h = vi.hoisted(() => ({
  verify: vi.fn(),
  find: vi.fn(),
  render: vi.fn(),
  fetch: vi.fn(),
  substack: vi.fn(),
  youtube: vi.fn(),
  fetchMovie: vi.fn(),
  fetchBook: vi.fn(),
}));

vi.mock('@/lib/qstash', () => ({ verifyQstashRequest: h.verify }));
vi.mock('@react-email/render', () => ({ render: h.render }));
vi.mock('@/lib/logtail', () => ({ logtail: { error: vi.fn() } }));
vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ find: h.find }),
}));
vi.mock('@payload-config', () => ({ default: {} }));
vi.mock('@/lib/omdb', () => ({ fetchMovieDataByImdbId: h.fetchMovie }));
vi.mock('@/lib/openlibrary', () => ({ fetchBookDataByOpenLibraryId: h.fetchBook }));
vi.mock('@/utils/getLatestSubstackPosts', () => ({ getLatestSubstackPosts: h.substack }));
vi.mock('@/utils/getLatestYouTubeVideo', () => ({ getLatestYouTubeVideo: h.youtube }));

import { POST } from './route';

// Sunday 2026-11-08, 9am ET.
const SUNDAY = new Date('2026-11-08T14:00:00.000Z');
const req = () => new Request('http://localhost/api/tasks/send-weekly-broadcast');

const event = (over: Record<string, unknown> = {}) => ({
  id: 3,
  name: 'The Thing',
  eventType: 'zvc',
  price: 10,
  datetime: '2026-11-14T23:30:00.000Z',
  _status: 'published',
  image: null,
  imdbId: null,
  description: null,
  location: { name: 'SingleCut' },
  ...over,
});

/** Resend: first call lists broadcasts, second creates + sends. */
function resend(existing: { name: string }[] = [], send = { ok: true, text: async () => '' }) {
  h.fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ data: existing }) })
    .mockResolvedValueOnce(send);
}

/** The props the email was rendered with. */
const renderedProps = () => h.render.mock.calls[0][0].props;

beforeEach(() => {
  vi.useFakeTimers({ now: SUNDAY, toFake: ['Date'] });
  process.env.RESEND_SEGMENT_ID = 'seg_1';
  process.env.RESEND_TOPIC_ID_WEEKLY = 'topic_weekly';
  process.env.RESEND_FULL_API_KEY = 're_full';
  h.verify.mockReset().mockResolvedValue({});
  h.find.mockReset().mockResolvedValue({ docs: [event()] });
  h.render.mockReset().mockResolvedValue('<html>week</html>');
  h.fetch.mockReset();
  h.substack.mockReset().mockResolvedValue([]);
  h.youtube.mockReset().mockResolvedValue(null);
  h.fetchMovie.mockReset().mockResolvedValue(null);
  h.fetchBook.mockReset().mockResolvedValue(null);
  vi.stubGlobal('fetch', h.fetch);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('send-weekly-broadcast task', () => {
  it('401s on an invalid signature', async () => {
    h.verify.mockRejectedValue(new Error('bad'));
    expect((await POST(req())).status).toBe(401);
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it('skips without sending when the weekly topic is not set', async () => {
    delete process.env.RESEND_TOPIC_ID_WEEKLY;
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it('sends one broadcast to the segment under the weekly topic', async () => {
    resend();
    const res = await POST(req());
    expect(res.status).toBe(200);

    const [url, init] = h.fetch.mock.calls[1];
    expect(url).toBe('https://api.resend.com/broadcasts');
    expect(init.headers.Authorization).toBe('Bearer re_full');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      name: 'This week at ZVC 2026-11-08',
      segment_id: 'seg_1',
      topic_id: 'topic_weekly',
      subject: 'This week at ZVC: Nov 8 – Nov 14',
      html: '<html>week</html>',
      send: true,
    });
  });

  it('does not send twice in one week', async () => {
    resend([{ name: 'This week at ZVC 2026-11-08' }]);
    const body = await (await POST(req())).json();
    expect(body.skipped).toBe(true);
    expect(h.fetch).toHaveBeenCalledTimes(1);
  });

  it('sends nothing when there are no events this week', async () => {
    resend();
    h.find.mockResolvedValue({ docs: [] });
    const body = await (await POST(req())).json();
    expect(body.skipped).toBe(true);
    expect(h.fetch).toHaveBeenCalledTimes(1);
  });

  it('queries published events from now through Saturday night, in order', async () => {
    resend();
    await POST(req());
    const args = h.find.mock.calls[0][0];
    expect(args.where._status).toEqual({ equals: 'published' });
    expect(args.where.datetime).toEqual({
      greater_than_equal: '2026-11-08T14:00:00.000Z',
      less_than: '2026-11-15T05:00:00.000Z',
    });
    expect(args.sort).toBe('datetime');
  });

  it('gives paid events a ticket link and free events none; every event a calendar link', async () => {
    resend();
    h.find.mockResolvedValue({
      docs: [event(), event({ id: 4, eventType: 'rww', price: 0 })],
    });
    await POST(req());
    const [paid, free] = renderedProps().events;
    expect(paid).toMatchObject({
      paid: true,
      ticketUrl: 'https://zerovisioncinema.com/events/3',
      calendarUrl: 'https://zerovisioncinema.com/api/events/3/calendar',
      typeName: 'Zero Vision Cinema',
    });
    expect(free).toMatchObject({
      paid: false,
      ticketUrl: undefined,
      calendarUrl: 'https://zerovisioncinema.com/api/events/4/calendar',
    });
    expect(renderedProps().moreEventsUrl).toBe('https://zerovisioncinema.com/events');
  });

  it('falls back to the film plot when the event has no description', async () => {
    resend();
    h.find.mockResolvedValue({ docs: [event({ imdbId: 'tt0084787' })] });
    h.fetchMovie.mockResolvedValue({ plot: 'Antarctic dread.', poster: 'https://p/x.jpg' });
    await POST(req());
    expect(renderedProps().events[0]).toMatchObject({
      fallbackDescription: 'Antarctic dread.',
      posterUrl: 'https://p/x.jpg',
    });
  });

  it('includes the latest video and post only if posted in the past week', async () => {
    resend();
    h.youtube.mockResolvedValue({
      title: 'New review',
      url: 'https://youtube.com/watch?v=1',
      thumbnailUrl: 'https://i.ytimg.com/1.jpg',
      publishedAt: '2026-11-05T15:00:00.000Z',
    });
    h.substack.mockResolvedValue([
      {
        title: 'Old essay',
        url: 'https://zvc.substack.com/p/old',
        imageUrl: null,
        publishedAt: '2026-10-20T15:00:00.000Z',
      },
    ]);
    await POST(req());
    expect(renderedProps().video).toEqual({
      title: 'New review',
      url: 'https://youtube.com/watch?v=1',
      imageUrl: 'https://i.ytimg.com/1.jpg',
    });
    expect(renderedProps().post).toBeNull();
  });

  it('500s (so QStash retries) when Resend rejects the send', async () => {
    resend([], { ok: false, text: async () => 'bad request' });
    expect((await POST(req())).status).toBe(500);
  });

  it('does not retry when the send fails in flight', async () => {
    h.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [] }) })
      .mockRejectedValueOnce(new Error('socket hang up'));
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect((await res.json()).ambiguous).toBe(true);
  });
});
