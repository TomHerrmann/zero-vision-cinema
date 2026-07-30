import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';
import { NextResponse } from 'next/server';
import { scheduleEventBroadcasts } from '@/lib/broadcasts';

// One-off backfill: schedule the announcement (−6d) + reminder (day-of)
// broadcasts for upcoming published events that don't have them yet. Kept out of
// app/ so it isn't a live endpoint. To run: copy to
// `app/api/backfill-broadcasts/route.ts`, `npm run dev`, hit
// `GET /api/backfill-broadcasts`, then delete it.
//
// Idempotent: skips a broadcast kind that already has a scheduled message id or
// a sent timestamp.

export async function GET() {
  const payload = await getPayload({ config: payloadConfig });
  const now = new Date();

  const { docs: events } = await payload.find({
    collection: 'events',
    where: {
      _status: { equals: 'published' },
      datetime: { greater_than: now.toISOString() },
    },
    limit: 1000,
    pagination: false,
    depth: 0,
  });

  const results: { eventId: number; scheduled: string[] }[] = [];
  let skipped = 0;

  for (const event of events) {
    const ids = await scheduleEventBroadcasts(
      event.id,
      new Date(event.datetime),
      now,
      {
        announcement: Boolean(
          event.announcementMessageId || event.announcementSentAt
        ),
        reminder: Boolean(event.reminderMessageId || event.reminderSentAt),
      }
    );

    if (ids.announcementMessageId || ids.reminderMessageId) {
      await payload.update({
        collection: 'events',
        id: event.id,
        data: {
          ...(ids.announcementMessageId
            ? { announcementMessageId: ids.announcementMessageId }
            : {}),
          ...(ids.reminderMessageId
            ? { reminderMessageId: ids.reminderMessageId }
            : {}),
        },
        context: { skipBroadcastReschedule: true },
      });
      results.push({ eventId: event.id, scheduled: Object.keys(ids) });
    } else {
      skipped++;
    }
  }

  return NextResponse.json({ backfilled: results.length, skipped, results });
}
