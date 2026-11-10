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
import type { Event } from '@/payload-types';
import {
  etDayRangeUtc,
  etDateKey,
  isEtSunday,
} from '@/utils/broadcastSchedule';
import { retireClosedPaymentLinks } from '@/lib/retirePaymentLinks';
import { eventClosesAt } from '@/utils/eventEnded';

const WEEKLY_URL = `${QSTASH_TARGET_BASE_URL}/api/tasks/send-weekly-broadcast`;
const WEEKLY_FAILURE_URL = `${QSTASH_TARGET_BASE_URL}/api/tasks/send-weekly-broadcast/failure`;
const RETIRE_URL = `${QSTASH_TARGET_BASE_URL}/api/tasks/retire-payment-links`;

/**
 * QStash-scheduled task: runs each morning at 9am ET (see
 * `scripts/ensure-broadcast-schedule.tsx`).
 *
 *  - Sundays: dispatches the weekly "This week at ZVC" email to
 *    `/api/tasks/send-weekly-broadcast`, which covers every event Sunday
 *    through Saturday. It replaced the per-event announcement (6 days out) and
 *    day-of reminder broadcasts, which this run no longer sends.
 *    `/api/tasks/send-broadcast` still exists for one-off sends by hand
 *    (`npm run broadcast:send`).
 *  - Every day: switches off Stripe payment links for events whose sales have
 *    closed, and schedules the same sweep for when each of today's events closes.
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
    let weekly: string | null = null;

    if (isEtSunday(now)) {
      const dateKey = etDateKey(now);
      await qstash.publishJSON({
        url: WEEKLY_URL,
        body: {},
        retries: 3,
        failureCallback: WEEKLY_FAILURE_URL,
        // Guards a retry of this dispatcher publishing twice. Hyphens only —
        // a ':' in a deduplicationId makes publishJSON throw. The weekly task
        // also checks Resend for this week's broadcast before sending.
        deduplicationId: `weekly-broadcast-${dateKey.replace(/-/g, '')}`,
      });
      weekly = dateKey;
    }

    const { start, end } = etDayRangeUtc(now, 0);
    const { docs: todaysEvents } = (await payload.find({
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
    })) as { docs: Event[] };

    // Switch off Stripe payment links for events whose sales have closed, and
    // schedule the same sweep for when each of today's events closes.
    // Best-effort — a Stripe or QStash hiccup must not make QStash retry (and
    // so re-dispatch) the weekly email above; tomorrow's run catches up.
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
        weekly,
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
