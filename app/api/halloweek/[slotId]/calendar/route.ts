import { NextResponse } from 'next/server';
import { ZVC_SITE_URL } from '@/app/contsants/constants';
import {
  HALLOWEEK_SCHEDULE,
  HALLOWEEK_VENUES,
} from '@/app/(frontend)/halloweek2026/halloweek.data';
import {
  buildIcs,
  googleCalendarUrl,
  HALLOWEEK_DURATION_MINUTES,
  type CalendarEvent,
} from '@/utils/eventCalendar';

type Params = { params: Promise<{ slotId: string }> };

const PAGE_URL = `${ZVC_SITE_URL}/halloweek2026`;

/**
 * "Add to calendar" for a Halloweek lineup slot. Same contract as
 * /api/events/[id]/calendar: an .ics file, or with `?format=google` a redirect
 * to a prefilled Google Calendar event. Halloweek lives in static data
 * (`halloweek.data.ts`), not Payload, so it needs its own lookup.
 */
export async function GET(req: Request, { params }: Params) {
  const { slotId } = await params;
  const slot = HALLOWEEK_SCHEDULE.find((s) => s.id === slotId);
  if (!slot) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const venue = HALLOWEEK_VENUES.find((v) => v.name === slot.venueName);
  const start = new Date(slot.datetime);
  const calendarEvent: CalendarEvent = {
    id: `halloweek2026-${slot.id}`,
    title: `${slot.title} · Halloweek`,
    start,
    end: new Date(start.getTime() + HALLOWEEK_DURATION_MINUTES * 60 * 1000),
    location: venue ? `${venue.name}, ${venue.address}` : slot.venueName,
    description: `${slot.description}\n\nDetails: ${PAGE_URL}`,
    url: PAGE_URL,
  };

  if (new URL(req.url).searchParams.get('format') === 'google') {
    return NextResponse.redirect(googleCalendarUrl(calendarEvent), 302);
  }

  return new NextResponse(buildIcs(calendarEvent), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="halloweek-${slot.id}.ics"`,
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
