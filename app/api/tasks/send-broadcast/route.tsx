import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { render } from '@react-email/render';
import { logtail } from '@/lib/logtail';
import { verifyQstashRequest } from '@/lib/qstash';
import {
  topicIdForEventType,
  resolveEventBroadcastData,
  type BroadcastKind,
} from '@/lib/broadcasts';
import {
  ZVC_EMAIL_ADDRESS,
  EMAIL_HEADER_IMAGE_ZVC_URL,
  EMAIL_HEADER_IMAGE_AHC_URL,
  EMAIL_HEADER_IMAGE_BOOKCLUB_URL,
  RESEND_BROADCASTS_API_URL,
  EVENT_TYPE_LABELS,
} from '@/app/contsants/constants';
import BroadcastEmail from '@/emails/BroadcastEmail';
import type { Event } from '@/payload-types';

type Body = { eventId?: number; kind?: BroadcastKind };

// Per-event-type header banner, so an AHC/book-club broadcast uses its own art.
function headerFor(eventType?: string | null): string {
  if (eventType === 'ahc') return EMAIL_HEADER_IMAGE_AHC_URL;
  if (eventType === 'bookclub') return EMAIL_HEADER_IMAGE_BOOKCLUB_URL;
  return EMAIL_HEADER_IMAGE_ZVC_URL;
}

const SENT_FIELD = {
  announcement: 'announcementSentAt',
  reminder: 'reminderSentAt',
} as const;

// One line each: a newline in a subject header gets stripped or mangled.
// EVENT_TYPE_LABELS is typed against Event['eventType'], so adding a fourth
// event type is a compile error rather than a "— undefined" subject.
const SUBJECT = {
  announcement: (event_: Event) =>
    `Coming up: ${event_.name} — ${EVENT_TYPE_LABELS[event_.eventType]}`,
  reminder: (event_: Event) =>
    `Today: ${event_.name} — ${EVENT_TYPE_LABELS[event_.eventType]}`,
};

/**
 * QStash-delivered task: send an event announcement/reminder BROADCAST to the
 * whole audience segment, scoped to the event-type topic (so recipients can
 * unsubscribe per type). Uses the Resend REST broadcasts API (segment_id +
 * topic_id — features the pinned SDK doesn't expose). Idempotent per event+kind.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await verifyQstashRequest<Body>(req);
  } catch (err) {
    await logtail.error(
      `API /tasks/send-broadcast: signature verification failed: ${err}`
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { eventId, kind } = body;
  if (!eventId || (kind !== 'announcement' && kind !== 'reminder')) {
    return NextResponse.json({ error: 'Bad payload' }, { status: 400 });
  }
  const sentField = SENT_FIELD[kind];

  try {
    const segmentId = process.env.RESEND_SEGMENT_ID;
    if (!segmentId) {
      // Not configured yet — skip loudly rather than retry forever.
      await logtail.error(
        `API /tasks/send-broadcast: RESEND_SEGMENT_ID not set; skipping ${kind} for event ${eventId}`
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

    // Skip if gone, already sent, unpublished, or past.
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

    const { movie, book, posterUrl, eventUrl, location, isPaid } =
      await resolveEventBroadcastData(event_);

    const html = await render(
      <BroadcastEmail
        kind={kind}
        eventType={event_.eventType}
        paid={isPaid}
        headerImage={headerFor(event_.eventType)}
        eventName={event_.name}
        eventImage={posterUrl ?? ''}
        eventDate={event_.datetime}
        eventLocation={location?.name ?? ''}
        eventAddress={location?.address}
        eventDescription={event_.description ?? undefined}
        movie={movie}
        book={book}
        eventUrl={eventUrl}
      />
    );

    // Must be the FULL-access key. RESEND_API_KEY is sending-only, and the
    // broadcasts endpoint rejects it with
    // `401 restricted_api_key: This API key is restricted to only send emails`.
    // Same key lib/resend.ts uses for audience/contact writes.
    const resendKey = process.env.RESEND_FULL_API_KEY;
    if (!resendKey) {
      throw new Error(
        'RESEND_FULL_API_KEY is not set — the broadcasts API rejects the ' +
          'sending-only RESEND_API_KEY'
      );
    }

    const res = await fetch(RESEND_BROADCASTS_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        segment_id: segmentId,
        topic_id: topicIdForEventType(event_.eventType),
        from: ZVC_EMAIL_ADDRESS,
        subject: SUBJECT[kind](event_),
        html,
        send: true,
      }),
    });
    if (!res.ok) {
      throw new Error(`Resend broadcast ${res.status}: ${await res.text()}`);
    }

    await payload.update({
      collection: 'events',
      id: eventId,
      data: { [sentField]: new Date().toISOString() },
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    await logtail.error(
      `API /tasks/send-broadcast: ${kind} failed for event ${eventId}: ${err}`,
      { method: 'POST', timestamp: new Date().toISOString() }
    );
    return NextResponse.json({ error: 'Broadcast failed' }, { status: 500 });
  }
}
