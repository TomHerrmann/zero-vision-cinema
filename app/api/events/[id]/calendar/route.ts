import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import type { Location } from '@/payload-types';
import { AHC_SITE_URL, ZVC_SITE_URL } from '@/app/contsants/constants';
import { getEventRuntimeMinutes } from '@/lib/eventRuntime';
import {
  buildIcs,
  eventCalendarEnd,
  googleCalendarUrl,
  type CalendarEvent,
} from '@/utils/eventCalendar';

type Params = { params: Promise<{ id: string }> };

/**
 * "Add to calendar" for any published event. Serves an .ics file (Apple
 * Calendar, Outlook, most phones), or with `?format=google` redirects to a
 * prefilled Google Calendar event. Done here rather than in the card so the
 * end time (which needs the film's runtime) is only looked up on click.
 */
export async function GET(req: Request, { params }: Params) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const payload = await getPayload({ config: payloadConfig });
  const { docs } = await payload.find({
    collection: 'events',
    where: { _status: { equals: 'published' }, id: { equals: Number(id) } },
    depth: 1,
    limit: 1,
  });
  const event = docs[0];
  if (!event) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const location =
    typeof event.location === 'object' ? (event.location as Location) : null;
  const url =
    event.eventType === 'zvc'
      ? `${ZVC_SITE_URL}/events/${event.id}`
      : AHC_SITE_URL;

  const calendarEvent: CalendarEvent = {
    id: event.id,
    title: event.name,
    start: new Date(event.datetime),
    end: eventCalendarEnd(event.datetime, await getEventRuntimeMinutes(event)),
    location: location
      ? [location.name, location.address].filter(Boolean).join(', ')
      : undefined,
    description: `Details: ${url}`,
    url,
  };

  if (new URL(req.url).searchParams.get('format') === 'google') {
    return NextResponse.redirect(googleCalendarUrl(calendarEvent), 302);
  }

  return new NextResponse(buildIcs(calendarEvent), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="zero-vision-cinema-event-${event.id}.ics"`,
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
