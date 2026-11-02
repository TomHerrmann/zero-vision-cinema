import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { HALLOWEEK_SCHEDULE } from '@/app/(frontend)/halloweek2026/halloweek.data';
import {
  halloweekCalendarEvent,
  payloadCalendarEvent,
} from '@/lib/calendarEntries';
import { buildIcsFeed } from '@/utils/eventCalendar';

/**
 * The subscribable calendar at zerovisioncinema.com/calendar.ics: every
 * published event of every type, plus the Halloweek lineup. Subscribed apps
 * re-fetch it on their own, so publishing, moving or unpublishing an event in
 * Payload is all it takes to update everyone's calendar.
 *
 * The last 60 days stay in so past nights don't vanish from subscribers'
 * calendars the moment they end.
 */
export const dynamic = 'force-dynamic';

const KEEP_PAST_DAYS = 60;

const startMinute = (date: Date) => Math.floor(date.getTime() / 60_000);

export async function GET() {
  const payload = await getPayload({ config: payloadConfig });
  const since = new Date(Date.now() - KEEP_PAST_DAYS * 24 * 60 * 60 * 1000);
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      _status: { equals: 'published' },
      datetime: { greater_than: since.toISOString() },
    },
    sort: ['datetime'],
    depth: 1,
    pagination: false,
  });

  const events = await Promise.all(docs.map(payloadCalendarEvent));
  // A Halloweek slot at the same minute as a Payload event is the same night
  // entered twice (see buildEventListing); keep the Payload one.
  const taken = new Set(events.map((e) => startMinute(e.start)));
  const halloweek = HALLOWEEK_SCHEDULE.map(halloweekCalendarEvent).filter(
    (e) => e.start > since && !taken.has(startMinute(e.start))
  );

  const all = [...events, ...halloweek].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );

  return new NextResponse(buildIcsFeed(all), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="zero-vision-cinema.ics"',
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
    },
  });
}
