import { NextResponse } from 'next/server';
import { HALLOWEEK_SCHEDULE } from '@/app/(frontend)/halloweek2026/halloweek.data';
import { halloweekCalendarEvent } from '@/lib/calendarEntries';
import { buildIcs, googleCalendarUrl } from '@/utils/eventCalendar';

type Params = { params: Promise<{ slotId: string }> };

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

  const calendarEvent = halloweekCalendarEvent(slot);

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
