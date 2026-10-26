import { ZVC_CALENDAR_FEED_URL } from '@/app/contsants/constants';
import { CALENDAR_NAME } from '@/utils/eventCalendar';

/**
 * One-tap subscribe links for the all-events calendar. Apple Calendar (and
 * most phones) subscribe from a webcal:// link; Google and Outlook each have
 * an "add by URL" page that takes the feed address.
 */
export function calendarSubscribeLinks(feedUrl: string = ZVC_CALENDAR_FEED_URL) {
  const webcal = feedUrl.replace(/^https?:\/\//, 'webcal://');
  return {
    apple: webcal,
    google: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`,
    outlook: `https://outlook.live.com/calendar/0/addfromweb?${new URLSearchParams({
      url: feedUrl,
      name: CALENDAR_NAME,
    })}`,
    feed: feedUrl,
  };
}
