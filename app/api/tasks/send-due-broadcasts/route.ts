import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { logtail } from '@/lib/logtail';
import {
  verifyQstashRequest,
  qstash,
  QSTASH_TARGET_BASE_URL,
  QSTASH_DELIVERY_ENABLED,
} from '@/lib/qstash';
import type { BroadcastKind } from '@/lib/broadcasts';
import type { Event } from '@/payload-types';
import { etDayRangeUtc, ANNOUNCE_DAYS_BEFORE } from '@/utils/broadcastSchedule';
import { retireClosedPaymentLinks } from '@/lib/retirePaymentLinks';
import { eventClosesAt } from '@/utils/eventEnded';

const TASK_URL = `${QSTASH_TARGET_BASE_URL}/api/tasks/send-broadcast`;
const FAILURE_URL = `${QSTASH_TARGET_BASE_URL}/api/tasks/send-broadcast/failure`;
const RETIRE_URL = `${QSTASH_TARGET_BASE_URL}/api/tasks/retire-payment-links`;

/** Which ET day each broadcast kind looks at, relative to this morning's run. */
const DUE: { kind: BroadcastKind; daysFromNow: number; sentField: string }[] = [
  { kind: 'reminder', daysFromNow: 0, sentField: 'reminderSentAt' },
  {
    kind: 'announcement',
    daysFromNow: ANNOUNCE_DAYS_BEFORE,
    sentField: 'announcementSentAt',
  },
];

/**
 * QStash-scheduled task: run each morning at 9am ET (see
 * `scripts/ensure-broadcast-schedule.tsx`) and dispatch the broadcasts that are
 * due — reminders for events happening today, announcements for events six days
 * out. One immediate message per event goes to `/api/tasks/send-broadcast`, so
 * every send keeps its own retries and dead-letter entry and a single flaky
 * metadata lookup can't strand the rest of the morning.
 *
 * This replaced scheduling a delayed message per event at creation time, which
 * QStash rejects beyond a 7-day horizon. Because it re-reads current data every
 * morning, moved, unpublished, and deleted events need no reconciliation.
 */
export async function POST(req: Request) {
  try {
    await verifyQstashRequest(req);
  } catch (err) {
    await logtail.error(
      `API /tasks/send-due-broadcasts: signature verification failed: ${err}`
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only reachable when running locally against cloud QStash, where every
  // publish below would queue a message aimed at localhost that can never be
  // delivered. Not an error — report and stop.
  if (!QSTASH_DELIVERY_ENABLED) {
    return NextResponse.json(
      {
        received: true,
        skippedAll: true,
        reason: `QStash cannot deliver to ${QSTASH_TARGET_BASE_URL}`,
      },
      { status: 200 }
    );
  }

  try {
    const payload = await getPayload({ config: payloadConfig });
    const now = new Date();
    const dispatched: { eventId: number; kind: BroadcastKind }[] = [];
    let skipped = 0;
    let todaysEvents: Event[] = [];

    for (const { kind, daysFromNow, sentField } of DUE) {
      const { start, end } = etDayRangeUtc(now, daysFromNow);

      const { docs: events } = await payload.find({
        collection: 'events',
        where: {
          _status: { equals: 'published' },
          datetime: {
            greater_than_equal: start.toISOString(),
            less_than: end.toISOString(),
          },
        },
        limit: 100,
        pagination: false,
        depth: 0,
      });

      if (kind === 'reminder') todaysEvents = events;

      for (const event of events) {
        // send-broadcast re-checks this itself; skipping here just avoids the
        // pointless round trip.
        if (event[sentField as keyof typeof event]) {
          skipped++;
          continue;
        }

        await qstash.publishJSON({
          url: TASK_URL,
          body: { eventId: event.id, kind },
          retries: 3,
          failureCallback: FAILURE_URL,
          // Guards the window where a retry of this dispatcher could publish
          // again before the first send stamps its *SentAt. Hyphens only — a
          // ':' in a deduplicationId makes publishJSON throw.
          deduplicationId: `broadcast-${event.id}-${kind}-${start
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, '')}`,
        });

        dispatched.push({ eventId: event.id, kind });
      }
    }

    // Riding the same morning run: switch off Stripe payment links for events
    // whose sales have closed, and schedule the same sweep for when each of
    // today's events closes. Best-effort — a Stripe or QStash hiccup must not make QStash
    // retry (and so re-dispatch) the broadcasts above; tomorrow's run catches
    // up on anything missed.
    let retiredPaymentLinks = 0;
    let scheduledRetirements = 0;
    try {
      retiredPaymentLinks = (await retireClosedPaymentLinks(payload, now)).length;
      for (const event of todaysEvents) {
        if (!event.paymentLink) continue;
        const closesAt = eventClosesAt(event.datetime);
        if (closesAt <= now) continue;
        await qstash.publishJSON({
          url: RETIRE_URL,
          body: {},
          notBefore: Math.ceil(closesAt.getTime() / 1000),
          retries: 3,
          deduplicationId: `retire-links-${event.id}-${closesAt.getTime()}`,
        });
        scheduledRetirements++;
      }
    } catch (err) {
      await logtail.error(
        `API /tasks/send-due-broadcasts: payment link retirement failed: ${err}`
      );
    }

    return NextResponse.json(
      {
        received: true,
        dispatched: dispatched.length,
        skipped,
        events: dispatched,
        retiredPaymentLinks,
        scheduledRetirements,
      },
      { status: 200 }
    );
  } catch (err) {
    await logtail.error(`API /tasks/send-due-broadcasts: ${err}`, {
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json({ error: 'Dispatch failed' }, { status: 500 });
  }
}
