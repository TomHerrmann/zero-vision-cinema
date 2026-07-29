import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';
import { NextResponse } from 'next/server';
import { scheduleOrderReminders } from '@/lib/reminders';

// One-off backfill: schedule pre-event + day-of reminders for already-sold
// tickets on upcoming ZVC events. Kept out of app/ so it isn't a live endpoint.
// To run: copy to `app/api/backfill-reminders/route.ts`, `npm run dev`, hit
// `GET /api/backfill-reminders`, then delete it.
//
// Idempotent: skips orders that already have a scheduled message id or a sent
// timestamp for a given reminder kind. The buyer email isn't needed here — the
// reminder task resolves it from Stripe (by the order's customer id) at send time.

export async function GET() {
  const payload = await getPayload({ config: payloadConfig });
  const now = new Date();

  const { docs: events } = await payload.find({
    collection: 'events',
    where: {
      _status: { equals: 'published' },
      eventType: { equals: 'zvc' },
      datetime: { greater_than: now.toISOString() },
    },
    limit: 500,
    pagination: false,
    depth: 0,
  });

  const results: { orderId: number; event: string; scheduled: string[] }[] = [];
  let skipped = 0;

  for (const event of events) {
    if (!event.productId) continue;

    const { docs: orders } = await payload.find({
      collection: 'orders',
      where: {
        productId: { equals: event.productId },
        refundedAt: { exists: false },
      },
      limit: 1000,
      pagination: false,
      depth: 0,
    });

    for (const order of orders) {
      const alreadyPre = Boolean(
        order.preEventMessageId || order.preEventEmailSentAt
      );
      const alreadyDay = Boolean(
        order.dayOfMessageId || order.dayOfEmailSentAt
      );
      if (alreadyPre && alreadyDay) {
        skipped++;
        continue;
      }

      const ids = await scheduleOrderReminders(
        order.id,
        new Date(event.datetime),
        now,
        { preEvent: alreadyPre, dayOf: alreadyDay }
      );

      if (ids.preEventMessageId || ids.dayOfMessageId) {
        await payload.update({
          collection: 'orders',
          id: order.id,
          data: {
            ...(ids.preEventMessageId
              ? { preEventMessageId: ids.preEventMessageId }
              : {}),
            ...(ids.dayOfMessageId
              ? { dayOfMessageId: ids.dayOfMessageId }
              : {}),
          },
        });
        results.push({
          orderId: order.id,
          event: event.name,
          scheduled: Object.keys(ids),
        });
      } else {
        skipped++;
      }
    }
  }

  return NextResponse.json({ backfilled: results.length, skipped, results });
}
