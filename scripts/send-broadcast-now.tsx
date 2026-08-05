/**
 * Send one event broadcast immediately, outside the daily 9am ET schedule.
 *
 *   npm run broadcast:send -- --event 47 --kind announcement --dry-run
 *   npm run broadcast:send -- --event 47 --kind announcement
 *
 * For when a window was missed — an event published fewer than 6 days out, or
 * created after that morning's run — and the announcement would otherwise never
 * go out, since the dispatcher only ever looks at today and today+6.
 *
 * This publishes a QStash message to /api/tasks/send-broadcast exactly as the
 * dispatcher would, so it goes through the same signature check, the same
 * already-sent guard, and the same retries. It does NOT bypass
 * `announcementSentAt` / `reminderSentAt`: if the broadcast already went out,
 * the task will skip it. Clear the stamp in the admin first if you genuinely
 * want to re-send.
 *
 * ⚠️ This mails the whole audience segment, scoped to the event type's topic.
 * Always --dry-run first and read back the event it found.
 */
import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';
import { qstash, QSTASH_TARGET_BASE_URL } from '@/lib/qstash';
import type { BroadcastKind } from '@/lib/broadcasts';

const TASK_URL = `${QSTASH_TARGET_BASE_URL}/api/tasks/send-broadcast`;
const FAILURE_URL = `${QSTASH_TARGET_BASE_URL}/api/tasks/send-broadcast/failure`;

const SENT_FIELD = {
  announcement: 'announcementSentAt',
  reminder: 'reminderSentAt',
} as const;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const eventId = Number(arg('event'));
  const kind = arg('kind') as BroadcastKind | undefined;

  if (!eventId || (kind !== 'announcement' && kind !== 'reminder')) {
    console.error(
      'usage: --event <id> --kind <announcement|reminder> [--dry-run]'
    );
    process.exit(2);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(
      'Refusing to run without NODE_ENV=production — Payload would try to push\n' +
        'schema changes to the target database. Use `npm run broadcast:send`.'
    );
    process.exit(1);
  }

  console.log(`mode    ${dryRun ? 'DRY RUN' : 'SEND'}`);
  console.log(`target  ${TASK_URL}`);
  console.log('');

  const payload = await getPayload({ config: payloadConfig });
  const event = await payload.findByID({
    collection: 'events',
    id: eventId,
    depth: 1,
    disableErrors: true,
  });

  if (!event) {
    console.error(`No event ${eventId}.`);
    process.exit(1);
  }

  const sentField = SENT_FIELD[kind];
  const alreadySent = event[sentField as keyof typeof event];
  const start = new Date(event.datetime);
  const location = event.location as { name?: string } | null;

  console.log(`  event      ${event.id} — ${event.name}`);
  console.log(`  type       ${event.eventType}   status: ${event._status}`);
  console.log(
    `  when       ${new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(start)} ET   at ${location?.name ?? '—'}`
  );
  console.log(`  kind       ${kind}`);
  console.log(`  ${sentField}  ${alreadySent ?? '(not yet sent)'}`);
  console.log('');

  // Mirror the task's own guards so the dry run tells the truth about what
  // would happen, rather than promising a send the task would skip.
  const blockers: string[] = [];
  if (alreadySent) blockers.push(`${sentField} is already set — task will skip`);
  if (event._status !== 'published') blockers.push('event is not published');
  if (start.getTime() < Date.now()) blockers.push('event is in the past');

  if (blockers.length > 0) {
    console.log('Would NOT send:');
    for (const b of blockers) console.log(`  · ${b}`);
    process.exit(1);
  }

  if (dryRun) {
    console.log(
      'DRY RUN — would publish this broadcast to the whole audience segment,\n' +
        `scoped to the ${event.eventType} topic. Re-run without --dry-run to send.`
    );
    return;
  }

  const res = await qstash.publishJSON({
    url: TASK_URL,
    body: { eventId: event.id, kind },
    retries: 3,
    failureCallback: FAILURE_URL,
  });

  console.log(`Published ${res.messageId}.`);
  console.log(`Broadcast is on its way; ${sentField} will be stamped on send.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
