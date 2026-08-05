import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  verify: vi.fn(),
  findByID: vi.fn(),
  update: vi.fn().mockResolvedValue({}),
  fetchMovie: vi.fn(),
  render: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('@/lib/qstash', () => ({ verifyQstashRequest: h.verify }));
vi.mock('@react-email/render', () => ({ render: h.render }));
vi.mock('@/lib/broadcasts', () => ({
  topicIdForEventType: () => 'topic_zvc',
}));
vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    findByID: h.findByID,
    update: h.update,
  }),
}));
vi.mock('@payload-config', () => ({ default: {} }));
vi.mock('@/lib/omdb', () => ({ fetchMovieDataByImdbId: h.fetchMovie }));
vi.mock('@/emails/BroadcastEmail', () => ({ default: () => null }));

import { POST } from './route';

const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
const event = {
  id: 3,
  name: 'The Thing',
  eventType: 'zvc',
  price: 10,
  datetime: future,
  _status: 'published',
  image: null,
  imdbId: null,
  location: { name: 'SingleCut', address: '19-33 37th St' },
  announcementSentAt: null as string | null,
  reminderSentAt: null as string | null,
};
const req = () => new Request('http://localhost/api/tasks/send-broadcast');

beforeEach(() => {
  process.env.RESEND_SEGMENT_ID = 'seg_1';
  // Sending-only key — present, but the broadcasts endpoint must NOT use it.
  process.env.RESEND_API_KEY = 're_restricted';
  process.env.RESEND_FULL_API_KEY = 're_full';
  h.verify.mockReset().mockResolvedValue({ eventId: 3, kind: 'announcement' });
  h.findByID.mockReset().mockResolvedValue({ ...event });
  h.update.mockReset().mockResolvedValue({});
  h.fetchMovie.mockReset().mockResolvedValue(null);
  h.render.mockReset().mockResolvedValue('<html>hi</html>');
  h.fetch.mockReset().mockResolvedValue({ ok: true, text: async () => '' });
  vi.stubGlobal('fetch', h.fetch);
});

describe('send-broadcast task', () => {
  it('401s on invalid signature', async () => {
    h.verify.mockRejectedValue(new Error('bad'));
    expect((await POST(req())).status).toBe(401);
  });

  it('400s on a bad payload (missing/invalid kind)', async () => {
    h.verify.mockResolvedValue({ eventId: 3 });
    expect((await POST(req())).status).toBe(400);
  });

  it('skips (no send) when RESEND_SEGMENT_ID is not configured', async () => {
    delete process.env.RESEND_SEGMENT_ID;
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it('skips when this kind already went out', async () => {
    h.findByID.mockResolvedValue({ ...event, announcementSentAt: '2026-01-01T00:00:00Z' });
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it('skips an unpublished or past event', async () => {
    h.findByID.mockResolvedValue({ ...event, _status: 'draft' });
    expect((await POST(req())).status).toBe(200);
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it('sends the broadcast to the segment+topic and stamps announcementSentAt', async () => {
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = h.fetch.mock.calls[0];
    expect(url).toBe('https://api.resend.com/broadcasts');
    const payload = JSON.parse(init.body);
    expect(payload).toMatchObject({
      segment_id: 'seg_1',
      topic_id: 'topic_zvc',
      send: true,
    });
    // Must be the full-access key: the broadcasts endpoint 401s the
    // sending-only RESEND_API_KEY with `restricted_api_key`.
    expect(init.headers.Authorization).toBe('Bearer re_full');
    expect(h.update.mock.calls[0][0].data).toHaveProperty('announcementSentAt');
  });

  it('brands the subject with the event type and keeps it on one line', async () => {
    await POST(req());
    const { subject } = JSON.parse(h.fetch.mock.calls[0][1].body);
    expect(subject).toBe('Coming up: The Thing — Zero Vision Cinema');
    // A newline in a subject header gets stripped or mangled in transit.
    expect(subject).not.toMatch(/[\r\n]/);
  });

  it('uses the Astoria Horror Club name for an AHC event', async () => {
    h.findByID.mockResolvedValue({ ...event, eventType: 'ahc', price: 0 });
    h.verify.mockResolvedValue({ eventId: 3, kind: 'reminder' });

    await POST(req());

    const { subject } = JSON.parse(h.fetch.mock.calls[0][1].body);
    expect(subject).toBe('Today: The Thing — Astoria Horror Club');
  });

  it('fails loudly when the full-access key is missing', async () => {
    delete process.env.RESEND_FULL_API_KEY;
    const res = await POST(req());
    expect(res.status).toBe(500);
    expect(h.fetch).not.toHaveBeenCalled();
    expect(h.update).not.toHaveBeenCalled();
  });

  it('returns 500 (retry) and does not stamp when Resend errors', async () => {
    h.fetch.mockResolvedValue({ ok: false, status: 500, text: async () => 'boom' });
    const res = await POST(req());
    expect(res.status).toBe(500);
    expect(h.update).not.toHaveBeenCalled();
  });
});
