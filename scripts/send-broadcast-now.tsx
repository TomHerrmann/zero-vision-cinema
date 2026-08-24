/**
 * Send one event broadcast immediately, outside the daily 9am ET schedule.
 *
 *   npm run broadcast:send -- --event 47 --kind announcement --dry-run
 *   npm run broadcast:send -- --event 47 --kind announcement
 *   npm run broadcast:send -- --event 47 --kind announcement --channel discord
 *
 * For when a window was missed — an event published fewer than 6 days out, or
 * created after that morning's run — and the announcement would otherwise never
 * go out, since the dispatcher only ever looks at today and today+6.
 *
 * This publishes a QStash message to the channel task(s) exactly as the
 * dispatcher would, so it goes through the same signature check, the same
 * already-sent guard, and the same retries. It does NOT bypass the `*SentAt`
 * stamps: if that channel's broadcast already went out, the task will skip it.
 * Clear the stamp in the admin first if you genuinely want to re-send.
 *
 * `--channel` defaults to `both`. Use `--channel discord` to smoke-test the
 * Discord post without mailing the segment, or `--channel email` for the
 * reverse.
 *
 * ⚠️ The email channel mails the whole audience segment, scoped to the event
 * type's topic. Always --dry-run first and read back the event it found.
 */
import { getPayload } from 'payload';
import payloadConfig from '@/payload.config';
import { qstash, QSTASH_TARGET_BASE_URL } from '@/lib/qstash';
import type { BroadcastKind } from '@/lib/broadcasts';

/** Keep in sync with CHANNELS in app/api/tasks/send-due-broadcasts/route.ts. */
const CHANNELS = {
  email: {
    url: `${QSTASH_TARGET_BASE_URL}/api/tasks/send-broadcast`,
    failureUrl: `${QSTASH_TARGET_BASE_URL}/api/tasks/send-broadcast/failure`,
    sentField: {
      announcement: 'announcementSentAt',
      reminder: 'reminderSentAt',
    },
  },
  discord: {
    url: `${QSTASH_TARGET_BASE_URL}/api/tasks/send-discord-broadcast`,
    failureUrl: `${QSTASH_TARGET_BASE_URL}/api/tasks/send-discord-broadcast/failure`,
    sentField: {
      announcement: 'discordAnnouncementSentAt',
      reminder: 'discordReminderSentAt',
    },
  },
} as const;

type ChannelName = keyof typeof CHANNELS;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const eventId = Number(arg('event'));
  const kind = arg('kind') as BroadcastKind | undefined;
  const channelArg = arg('channel') ?? 'both';

  const channels: ChannelName[] =
    channelArg === 'both' ? ['email', 'discord'] : [channelArg as ChannelName];

  if (
    !eventId ||
    (kind !== 'announcement' && kind !== 'reminder') ||
    channels.some((c) => !CHANNELS[c])
  ) {
    console.error(
      'usage: --event <id> --kind <announcement|reminder> ' +
        '[--channel email|discord|both] [--dry-run]'
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

  console.log(`mode     ${dryRun ? 'DRY RUN' : 'SEND'}`);
  console.log(`channels ${channels.join(', ')}`);
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
  for (const name of channels) {
    const field = CHANNELS[name].sentField[kind];
    console.log(
      `  ${field.padEnd(26)} ${event[field as keyof typeof event] ?? '(not yet sent)'}`
    );
  }
  console.log('');

  // Mirror the tasks' own guards so the dry run tells the truth about what
  // would happen, rather than promising a send the task would skip. Event-wide
  // blockers stop everything; an already-set stamp only drops its own channel.
  const blockers: string[] = [];
  if (event._status !== 'published') blockers.push('event is not published');
  if (start.getTime() < Date.now()) blockers.push('event is in the past');

  if (blockers.length > 0) {
    console.log('Would NOT send:');
    for (const b of blockers) console.log(`  · ${b}`);
    process.exit(1);
  }

  const todo = channels.filter((name) => {
    const field = CHANNELS[name].sentField[kind];
    if (event[field as keyof typeof event]) {
      console.log(`  · skipping ${name}: ${field} is already set`);
      return false;
    }
    return true;
  });

  if (todo.length === 0) {
    console.log('\nNothing to send — every requested channel already went out.');
    process.exit(1);
  }

  if (dryRun) {
    console.log(
      `DRY RUN — would publish to: ${todo.join(', ')}.\n` +
        (todo.includes('email')
          ? `The email goes to the whole audience segment, scoped to the ${event.eventType} topic.\n`
          : '') +
        'Re-run without --dry-run to send.'
    );
    return;
  }

  for (const name of todo) {
    const channel = CHANNELS[name];
    const res = await qstash.publishJSON({
      url: channel.url,
      body: { eventId: event.id, kind },
      retries: 3,
      failureCallback: channel.failureUrl,
    });
    console.log(
      `Published ${name} → ${res.messageId}; ` +
        `${channel.sentField[kind]} will be stamped on send.`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
