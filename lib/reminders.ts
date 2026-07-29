import type { Payload } from 'payload';
import { qstash, QSTASH_TARGET_BASE_URL } from '@/lib/qstash';
import { computeReminderSchedule } from '@/utils/reminderSchedule';
import type { ReminderKind } from '@/emails/EventReminderEmail';

const TASK_URL = `${QSTASH_TARGET_BASE_URL}/api/tasks/send-event-reminder`;
const FAILURE_URL = `${QSTASH_TARGET_BASE_URL}/api/tasks/send-event-reminder/failure`;

async function publishReminder(
  orderId: number,
  kind: ReminderKind,
  at: Date
): Promise<string> {
  // No deduplicationId: the webhook is already idempotent on the order (a
  // retried webhook returns early), and reschedules deliberately publish fresh
  // messages — a reused dedup id would silently drop the re-publish.
  const res = await qstash.publishJSON({
    url: TASK_URL,
    body: { orderId, kind },
    notBefore: Math.floor(at.getTime() / 1000), // QStash expects Unix seconds
    retries: 3,
    failureCallback: FAILURE_URL,
  });
  return res.messageId;
}

/**
 * Schedule the pre-event and day-of reminders for an order. `from` is the
 * reference time for the "bought <7d / <48h" rules (purchase time at checkout,
 * or now for backfill/reschedule). Returns the QStash message ids to persist so
 * the reminders can be cancelled later.
 */
export async function scheduleOrderReminders(
  orderId: number,
  eventStart: Date,
  from: Date = new Date(),
  skip: { preEvent?: boolean; dayOf?: boolean } = {}
): Promise<{ preEventMessageId?: string; dayOfMessageId?: string }> {
  const { preEventAt, dayOfAt } = computeReminderSchedule(from, eventStart);
  const out: { preEventMessageId?: string; dayOfMessageId?: string } = {};
  if (preEventAt && !skip.preEvent) {
    out.preEventMessageId = await publishReminder(
      orderId,
      'pre-event',
      preEventAt
    );
  }
  if (dayOfAt && !skip.dayOf) {
    out.dayOfMessageId = await publishReminder(orderId, 'day-of', dayOfAt);
  }
  return out;
}

/**
 * Cancel an order's scheduled reminders that haven't been sent yet. Safe to call
 * when the ids are missing or already delivered (delete errors are ignored).
 */
export async function cancelOrderReminders(order: {
  preEventMessageId?: string | null;
  dayOfMessageId?: string | null;
  preEventEmailSentAt?: string | null;
  dayOfEmailSentAt?: string | null;
}): Promise<void> {
  const ids = [
    order.preEventEmailSentAt ? null : order.preEventMessageId,
    order.dayOfEmailSentAt ? null : order.dayOfMessageId,
  ].filter((id): id is string => Boolean(id));

  for (const id of ids) {
    try {
      await qstash.messages.cancel(id);
    } catch {
      // Already delivered, already cancelled, or unknown — nothing to do.
    }
  }
}

/**
 * Re-sync every (non-refunded) order's reminders for an event after its date
 * changed or it was unpublished/deleted. Cancels the currently-scheduled
 * messages and, if the event is still upcoming & published, re-schedules from
 * now — skipping any reminder kind that has already been sent so buyers don't
 * get a duplicate. Intended for Events collection afterChange/afterDelete hooks.
 */
export async function rescheduleRemindersForEvent(
  payload: Payload,
  event: {
    productId?: string | null;
    datetime: string;
    _status?: string | null;
  },
  { cancelOnly = false }: { cancelOnly?: boolean } = {}
): Promise<void> {
  if (!event.productId) return;

  const { docs: orders } = await payload.find({
    collection: 'orders',
    where: {
      productId: { equals: event.productId },
      refundedAt: { exists: false },
    },
    limit: 1000,
    depth: 0,
  });

  const eventStart = new Date(event.datetime);
  const upcomingAndPublished =
    !cancelOnly &&
    event._status === 'published' &&
    eventStart.getTime() > Date.now();

  for (const order of orders) {
    await cancelOrderReminders(order);

    const data: {
      preEventMessageId: string | null;
      dayOfMessageId: string | null;
    } = { preEventMessageId: null, dayOfMessageId: null };

    if (upcomingAndPublished) {
      const ids = await scheduleOrderReminders(
        order.id,
        eventStart,
        new Date(),
        {
          preEvent: Boolean(order.preEventEmailSentAt),
          dayOf: Boolean(order.dayOfEmailSentAt),
        }
      );
      data.preEventMessageId = ids.preEventMessageId ?? null;
      data.dayOfMessageId = ids.dayOfMessageId ?? null;
    }

    await payload.update({ collection: 'orders', id: order.id, data });
  }
}
