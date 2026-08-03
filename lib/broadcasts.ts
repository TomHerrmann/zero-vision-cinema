import type { Payload } from 'payload';
import { qstash, QSTASH_TARGET_BASE_URL } from '@/lib/qstash';
import { computeBroadcastSchedule } from '@/utils/broadcastSchedule';

export type BroadcastKind = 'announcement' | 'reminder';

const TASK_URL = `${QSTASH_TARGET_BASE_URL}/api/tasks/send-broadcast`;
const FAILURE_URL = `${QSTASH_TARGET_BASE_URL}/api/tasks/send-broadcast/failure`;

/** Resend Topic id for an event type, so recipients can unsubscribe per type. */
export function topicIdForEventType(
  eventType?: string | null
): string | undefined {
  switch (eventType) {
    case 'zvc':
      return process.env.RESEND_TOPIC_ID_ZVC;
    case 'ahc':
      return process.env.RESEND_TOPIC_ID_AHC;
    case 'bookclub':
      return process.env.RESEND_TOPIC_ID_BOOK_CLUB;
    default:
      return undefined;
  }
}

async function publishBroadcast(
  eventId: number,
  kind: BroadcastKind,
  at: Date
): Promise<string> {
  const res = await qstash.publishJSON({
    url: TASK_URL,
    body: { eventId, kind },
    notBefore: Math.floor(at.getTime() / 1000), // Unix seconds
    retries: 3,
    failureCallback: FAILURE_URL,
  });
  return res.messageId;
}

/**
 * Schedule an event's announcement (−6d, 9am ET) and reminder (day-of, 9am ET)
 * broadcasts. `skip` omits a kind that already went out (used on reschedule).
 * Returns the QStash message ids to persist so they can be cancelled.
 */
export async function scheduleEventBroadcasts(
  eventId: number,
  eventStart: Date,
  from: Date = new Date(),
  skip: { announcement?: boolean; reminder?: boolean } = {}
): Promise<{ announcementMessageId?: string; reminderMessageId?: string }> {
  const { announcementAt, reminderAt } = computeBroadcastSchedule(
    from,
    eventStart
  );
  const out: { announcementMessageId?: string; reminderMessageId?: string } = {};
  if (announcementAt && !skip.announcement) {
    out.announcementMessageId = await publishBroadcast(
      eventId,
      'announcement',
      announcementAt
    );
  }
  if (reminderAt && !skip.reminder) {
    out.reminderMessageId = await publishBroadcast(
      eventId,
      'reminder',
      reminderAt
    );
  }
  return out;
}

/** Cancel an event's not-yet-sent scheduled broadcasts. Errors are ignored. */
export async function cancelEventBroadcasts(event: {
  announcementMessageId?: string | null;
  reminderMessageId?: string | null;
  announcementSentAt?: string | null;
  reminderSentAt?: string | null;
}): Promise<void> {
  const ids = [
    event.announcementSentAt ? null : event.announcementMessageId,
    event.reminderSentAt ? null : event.reminderMessageId,
  ].filter((id): id is string => Boolean(id));
  for (const id of ids) {
    try {
      await qstash.messages.cancel(id);
    } catch {
      // Already delivered, cancelled, or unknown — nothing to do.
    }
  }
}

type BroadcastEvent = {
  id: number;
  datetime: string;
  _status?: string | null;
  announcementMessageId?: string | null;
  reminderMessageId?: string | null;
  announcementSentAt?: string | null;
  reminderSentAt?: string | null;
};

/**
 * Re-sync an event's scheduled broadcasts after it's published, its date
 * changes, or it's unpublished/deleted. Cancels the current messages and, if
 * still upcoming & published, re-schedules from now (skipping any kind already
 * sent). Intended for the Events afterChange/afterDelete hooks. Updates the
 * event with `context.skipBroadcastReschedule` so it doesn't recurse.
 */
export async function rescheduleEventBroadcasts(
  payload: Payload,
  event: BroadcastEvent,
  { cancelOnly = false }: { cancelOnly?: boolean } = {}
): Promise<void> {
  await cancelEventBroadcasts(event);

  const eventStart = new Date(event.datetime);
  const upcomingAndPublished =
    !cancelOnly &&
    event._status === 'published' &&
    eventStart.getTime() > Date.now();

  let announcementMessageId: string | null = null;
  let reminderMessageId: string | null = null;

  if (upcomingAndPublished) {
    const ids = await scheduleEventBroadcasts(event.id, eventStart, new Date(), {
      announcement: Boolean(event.announcementSentAt),
      reminder: Boolean(event.reminderSentAt),
    });
    announcementMessageId = ids.announcementMessageId ?? null;
    reminderMessageId = ids.reminderMessageId ?? null;
  }

  await payload.update({
    collection: 'events',
    id: event.id,
    data: { announcementMessageId, reminderMessageId },
    context: { skipBroadcastReschedule: true },
  });
}
