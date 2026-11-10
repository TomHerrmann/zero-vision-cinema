import { describe, it, expect, vi, afterEach } from 'vitest';
import { getLatestYouTubeVideo, parseYouTubeEntry } from './getLatestYouTubeVideo';

const entry = (id: string, path: string, title: string, published: string) => `
<entry>
  <id>yt:video:${id}</id>
  <yt:videoId>${id}</yt:videoId>
  <title>${title}</title>
  <link rel="alternate" href="https://www.youtube.com/${path}"/>
  <published>${published}</published>
  <media:group>
    <media:thumbnail url="https://i.ytimg.com/vi/${id}/hqdefault.jpg" width="480" height="360"/>
  </media:group>
</entry>`;

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.YOUTUBE_CHANNEL_ID;
});

describe('parseYouTubeEntry', () => {
  it('reads title, link, thumbnail and date', () => {
    expect(
      parseYouTubeEntry(entry('abc', 'watch?v=abc', 'Prey &amp; Predators', '2026-11-05T15:00:00+00:00'))
    ).toEqual({
      title: 'Prey & Predators',
      url: 'https://www.youtube.com/watch?v=abc',
      thumbnailUrl: 'https://i.ytimg.com/vi/abc/hqdefault.jpg',
      publishedAt: '2026-11-05T15:00:00.000Z',
    });
  });
});

describe('getLatestYouTubeVideo', () => {
  it('returns null without a channel id, and fetches nothing', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect(await getLatestYouTubeVideo()).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('skips Shorts and returns the newest full video', async () => {
    process.env.YOUTUBE_CHANNEL_ID = 'UC123';
    const xml = `<feed>${entry('s1', 'shorts/s1', 'A short', '2026-11-06T00:00:00+00:00')}${entry('v1', 'watch?v=v1', 'A review', '2026-11-05T00:00:00+00:00')}</feed>`;
    const fetch = vi.fn().mockResolvedValue({ ok: true, text: async () => xml });
    vi.stubGlobal('fetch', fetch);
    const video = await getLatestYouTubeVideo();
    expect(fetch.mock.calls[0][0]).toBe('https://www.youtube.com/feeds/videos.xml?channel_id=UC123');
    expect(video?.title).toBe('A review');
  });

  it('returns null when the feed fails', async () => {
    process.env.YOUTUBE_CHANNEL_ID = 'UC123';
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')));
    expect(await getLatestYouTubeVideo()).toBeNull();
  });
});
