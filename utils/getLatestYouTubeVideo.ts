export type YouTubeVideo = {
  title: string;
  url: string;
  thumbnailUrl: string | null;
  /** ISO timestamp */
  publishedAt: string | null;
};

const decodeEntities = (text: string) =>
  text
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16))
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

const readTag = (xml: string, tag: string) => {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  const raw = match?.[1].trim();
  return raw ? decodeEntities(raw) : null;
};

export const parseYouTubeEntry = (entry: string): YouTubeVideo | null => {
  const title = readTag(entry, 'title');
  const url = entry.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/)?.[1];
  if (!title || !url) return null;
  const published = readTag(entry, 'published');
  const date = published ? new Date(published) : null;
  return {
    title,
    url: decodeEntities(url),
    thumbnailUrl: entry.match(/<media:thumbnail[^>]*\surl="([^"]+)"/)?.[1] ?? null,
    publishedAt: date && !isNaN(date.getTime()) ? date.toISOString() : null,
  };
};

/**
 * Newest long-form video from the channel's public feed (no API key needed).
 * Shorts are skipped: the feed links them as /shorts/<id>. Needs
 * YOUTUBE_CHANNEL_ID (the "UC…" id from YouTube Studio → Settings → Channel →
 * Advanced settings). Returns null instead of throwing, so a YouTube outage or
 * a missing id only drops the card from the email.
 */
export const getLatestYouTubeVideo = async (): Promise<YouTubeVideo | null> => {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!channelId) return null;
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`
    );
    if (!res.ok) return null;
    const xml = await res.text();
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
    for (const entry of entries) {
      const video = parseYouTubeEntry(entry);
      if (video && !video.url.includes('/shorts/')) return video;
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch YouTube feed', error);
    return null;
  }
};
