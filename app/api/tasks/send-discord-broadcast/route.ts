import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { logtail } from '@/lib/logtail';
import { verifyQstashRequest } from '@/lib/qstash';
import { resolveEventBroadcastData, type BroadcastKind } from '@/lib/broadcasts';
import { postDiscordWebhook } from '@/lib/discord';
import { buildEventDiscordMessage } from '@/utils/discordEmbed';
import { richTextToPlainText } from '@/utils/richText';
import type { Event } from '@/payload-types';

type Body = { eventId?: number; kind?: BroadcastKind };

const SENT_FIELD = {
  announcement: 'discordAnnouncementSentAt',
  reminder: 'discordReminderSentAt',
} as const;

/**
 * QStash-delivered task: post an event announcement/reminder to the community
 * Discord channel. The email twin of this route is /api/tasks/send-broadcast;
 * the two are dispatched as separate messages with separate `*SentAt` stamps,
 * so a Discord outage never blocks an email or causes one to be sent twice.
 * Idempotent per event+kind.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await verifyQstashRequest<Body>(req);
  } catch (err) {
    await logtail.error(
      `API /tasks/send-discord-broadcast: signature verification failed: ${err}`
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { eventId, kind } = body;
  if (!eventId || (kind !== 'announcement' && kind !== 'reminder')) {
    return NextResponse.json({ error: 'Bad payload' }, { status: 400 });
  }
  const sentField = SENT_FIELD[kind];

  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      // Not configured yet — skip loudly rather than retry forever.
      await logtail.error(
        `API /tasks/send-discord-broadcast: DISCORD_WEBHOOK_URL not set; skipping ${kind} for event ${eventId}`
      );
      return NextResponse.json(
        { received: true, skipped: true },
        { status: 200 }
      );
    }

    const payload = await getPayload({ config: payloadConfig });
    const event_ = (await payload.findByID({
      collection: 'events',
      id: eventId,
      depth: 1,
      disableErrors: true,
    })) as Event | null;

    // Skip if gone, already posted, unpublished, or past.
    if (
      !event_ ||
      event_[sentField] ||
      event_._status !== 'published' ||
      new Date(event_.datetime).getTime() < Date.now()
    ) {
      return NextResponse.json(
        { received: true, skipped: true },
        { status: 200 }
      );
    }

    const { movie, book, posterUrl, eventUrl, location } =
      await resolveEventBroadcastData(event_);

    await postDiscordWebhook(
      webhookUrl,
      buildEventDiscordMessage({
        kind,
        eventType: event_.eventType,
        name: event_.name,
        datetime: event_.datetime,
        eventUrl,
        posterUrl,
        description: richTextToPlainText(event_.description),
        locationName: location?.name,
        locationAddress: location?.address ?? undefined,
        price: event_.price,
        movie,
        book,
      })
    );

    await payload.update({
      collection: 'events',
      id: eventId,
      data: { [sentField]: new Date().toISOString() },
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    await logtail.error(
      `API /tasks/send-discord-broadcast: ${kind} failed for event ${eventId}: ${err}`,
      { method: 'POST', timestamp: new Date().toISOString() }
    );
    return NextResponse.json({ error: 'Discord broadcast failed' }, { status: 500 });
  }
}
