import { describe, it, expect, vi, beforeEach } from 'vitest';

const h = vi.hoisted(() => ({
  verify: vi.fn(),
  findByID: vi.fn(),
  update: vi.fn().mockResolvedValue({}),
  fetchMovie: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('@/lib/qstash', () => ({ verifyQstashRequest: h.verify }));
vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    findByID: h.findByID,
    update: h.update,
  }),
}));
vi.mock('@payload-config', () => ({ default: {} }));
vi.mock('@/lib/omdb', () => ({ fetchMovieDataByImdbId: h.fetchMovie }));

// `lib/discord` and `utils/discordEmbed` run for real over a stubbed global
// fetch, so the body Discord actually receives is what gets asserted here.
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
  description: null,
  location: { name: 'SingleCut', address: '19-33 37th St' },
  discordAnnouncementSentAt: null as string | null,
  discordReminderSentAt: null as string | null,
};
const req = () =>
  new Request('http://localhost/api/tasks/send-discord-broadcast');

const postedBody = () => JSON.parse(h.fetch.mock.calls[0][1].body);

beforeEach(() => {
  process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1/tok';
  h.verify.mockReset().mockResolvedValue({ eventId: 3, kind: 'announcement' });
  h.findByID.mockReset().mockResolvedValue({ ...event });
  h.update.mockReset().mockResolvedValue({});
  h.fetchMovie.mockReset().mockResolvedValue(null);
  h.fetch.mockReset().mockResolvedValue({ ok: true, text: async () => '{}' });
  vi.stubGlobal('fetch', h.fetch);
});

describe('send-discord-broadcast task', () => {
  it('401s on invalid signature and does nothing else', async () => {
    h.verify.mockRejectedValue(new Error('bad'));
    expect((await POST(req())).status).toBe(401);
    expect(h.findByID).not.toHaveBeenCalled();
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it('400s on a bad payload (missing/invalid kind)', async () => {
    h.verify.mockResolvedValue({ eventId: 3 });
    expect((await POST(req())).status).toBe(400);
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it('skips (no post) when DISCORD_WEBHOOK_URL is not configured', async () => {
    delete process.env.DISCORD_WEBHOOK_URL;
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.fetch).not.toHaveBeenCalled();
    expect(h.update).not.toHaveBeenCalled();
  });

  it('skips when this kind already went out', async () => {
    h.findByID.mockResolvedValue({
      ...event,
      discordAnnouncementSentAt: '2026-01-01T00:00:00Z',
    });
    expect((await POST(req())).status).toBe(200);
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it('is stamped independently of the email send', async () => {
    // The email already went out; the Discord post still should.
    h.findByID.mockResolvedValue({
      ...event,
      announcementSentAt: '2026-01-01T00:00:00Z',
    });
    expect((await POST(req())).status).toBe(200);
    expect(h.fetch).toHaveBeenCalledTimes(1);
  });

  it('skips an unpublished event', async () => {
    h.findByID.mockResolvedValue({ ...event, _status: 'draft' });
    expect((await POST(req())).status).toBe(200);
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it('skips a past event', async () => {
    h.findByID.mockResolvedValue({
      ...event,
      datetime: '2020-01-01T00:00:00Z',
    });
    expect((await POST(req())).status).toBe(200);
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it('skips a deleted event', async () => {
    h.findByID.mockResolvedValue(null);
    expect((await POST(req())).status).toBe(200);
    expect(h.fetch).not.toHaveBeenCalled();
  });

  it('posts the embed to the webhook and stamps discordAnnouncementSentAt', async () => {
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(h.fetch).toHaveBeenCalledTimes(1);

    const [url, init] = h.fetch.mock.calls[0];
    // `wait=true` makes Discord validate the embed instead of returning 204.
    expect(url).toBe('https://discord.com/api/webhooks/1/tok?wait=true');
    expect(init.method).toBe('POST');

    const body = postedBody();
    expect(body.content).toBe('**Coming up:** The Thing — Zero Vision Cinema');
    expect(body.allowed_mentions).toEqual({ parse: [] });
    expect(body.embeds[0]).toMatchObject({
      title: 'The Thing',
      url: 'https://zerovisioncinema.com/events/3',
    });

    expect(h.update.mock.calls[0][0].data).toHaveProperty(
      'discordAnnouncementSentAt'
    );
  });

  it('uses the reminder wording on the day', async () => {
    h.verify.mockResolvedValue({ eventId: 3, kind: 'reminder' });
    await POST(req());
    expect(postedBody().content).toBe(
      '**Today:** The Thing — Zero Vision Cinema'
    );
    expect(h.update.mock.calls[0][0].data).toHaveProperty(
      'discordReminderSentAt'
    );
  });

  it('flattens the event description into the embed', async () => {
    h.findByID.mockResolvedValue({
      ...event,
      description: {
        root: {
          children: [
            { type: 'paragraph', children: [{ type: 'text', text: 'Antarctica.' }] },
          ],
        },
      },
    });
    await POST(req());
    expect(postedBody().embeds[0].description).toBe('Antarctica.');
  });

  it('links to the AHC page for a free AHC event and drops the ticket field', async () => {
    h.findByID.mockResolvedValue({ ...event, eventType: 'ahc', price: 0 });
    await POST(req());
    const embed = postedBody().embeds[0];
    expect(embed.url).toBe('https://zerovisioncinema.com/astoriahorrorclub');
    expect(embed.fields.some((f: { name: string }) => f.name === 'Tickets')).toBe(
      false
    );
  });

  it('returns 500 (retry) and does not stamp when Discord errors', async () => {
    h.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'bad embed',
    });
    const res = await POST(req());
    expect(res.status).toBe(500);
    expect(h.update).not.toHaveBeenCalled();
  });
});
