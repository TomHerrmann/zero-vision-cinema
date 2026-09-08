import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { render } from '@react-email/render';
import { logtail } from '@/lib/logtail';
import { verifyQstashRequest } from '@/lib/qstash';
import { topicIdForEventType, type BroadcastKind } from '@/lib/broadcasts';
import { fetchMovieDataByImdbId } from '@/lib/omdb';
import { fetchBookDataByOpenLibraryId } from '@/lib/openlibrary';
import {
  ZVC_EMAIL_ADDRESS,
  ZVC_SITE_URL,
  AHC_SITE_URL,
  EMAIL_HEADER_IMAGE_ZVC_URL,
  EMAIL_HEADER_IMAGE_AHC_URL,
  EMAIL_HEADER_IMAGE_BOOKCLUB_URL,
  RESEND_BROADCASTS_API_URL,
} from '@/app/contsants/constants';
import BroadcastEmail from '@/emails/BroadcastEmail';
import type { Event, Location, Media } from '@/payload-types';

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

// Typed against Event['eventType'] so adding a fourth event type is a compile
// error here, rather than silently mailing the segment a "— undefined" subject.
const EventTypeMap: Record<Event['eventType'], string> = {
  zvc: 'Zero Vision Cinema',
  ahc: 'Astoria Horror Club',
  bookclub: 'Astoria Horror Book Club',
};

// One line each: a newline in a subject header gets stripped or mangled.
const SUBJECT = {
  announcement: (event_: Event) =>
    `Coming up: ${event_.name} — ${EventTypeMap[event_.eventType]}`,
  reminder: (event_: Event) =>
    `Today: ${event_.name} — ${EventTypeMap[event_.eventType]}`,
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

    const isBookClub = event_.eventType === 'bookclub';

    // OMDB film data (film screenings), or Open Library book data (book club) —
    // shown in the broadcast and used as the poster fallback.
    const movie =
      !isBookClub && event_.imdbId
        ? await fetchMovieDataByImdbId(event_.imdbId)
        : null;
    const bookData =
      isBookClub && event_.openLibraryId
        ? await fetchBookDataByOpenLibraryId(event_.openLibraryId)
        : null;
    const book =
      isBookClub && (event_.bookTitle || event_.bookAuthor || bookData)
        ? {
            title: event_.bookTitle ?? undefined,
            author: event_.bookAuthor ?? undefined,
            cover: bookData?.cover,
            description: bookData?.description,
          }
        : null;

    // Poster: uploaded blob image if present, else the OMDB / book cover.
    const image =
      typeof event_.image === 'object' ? (event_.image as Media) : null;
    const posterUrl = image?.filename
      ? `${process.env.VERCEL_BLOB_URL}${image.filename}`
      : movie?.poster || book?.cover || undefined;

    const location = event_.location as Location;
    const isPaid = (event_.price ?? 0) > 0; // paid ZVC vs free AHC / book club
    const eventUrl =
      event_.eventType === 'zvc'
        ? `${ZVC_SITE_URL}/events/${event_.id}`
        : AHC_SITE_URL;

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

    // Claim the send BEFORE calling Resend, not after. A broadcast goes to the
    // entire segment, so the one unacceptable outcome is sending it twice —
    // and stamping afterwards produced exactly that: the stamp threw, the task
    // 500'd, and QStash's retry re-sent to everyone because the guard above
    // reads a stamp that never landed. With the claim written first, nothing
    // remains after the send that can fail and trigger a retry.
    //
    // `skipStripeSync` is required, and is the other half of the same bug: the
    // Events beforeChange hook re-syncs the event to Stripe, and an event whose
    // payment link no longer exists there throws (collections/Events.ts:232).
    // Nothing Stripe mirrors is changing here. Same guard as the webhook's
    // ticketsSold update.
    await payload.update({
      collection: 'events',
      id: eventId,
      data: { [sentField]: new Date().toISOString() },
      context: { skipStripeSync: true },
    });

    let res: Response;
    try {
      res = await fetch(RESEND_BROADCASTS_API_URL, {
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
    } catch (sendErr) {
      // The connection broke with the outcome unknown — Resend may well have
      // accepted the broadcast. Keep the claim and don't retry: a silent
      // non-delivery that can be re-sent by hand beats mailing the segment
      // twice. 200 so QStash stops here; the log is the alert.
      await logtail.error(
        `API /tasks/send-broadcast: ${kind} for event ${eventId} failed in flight: ${sendErr}. ` +
          `Claim kept and NOT retried — check Resend, and re-send by hand if nothing went out.`,
        { method: 'POST', timestamp: new Date().toISOString() }
      );
      return NextResponse.json(
        { received: true, ambiguous: true },
        { status: 200 }
      );
    }

    if (!res.ok) {
      // Resend rejected the request outright, so nothing was sent and a retry
      // is safe. Release the claim so the retry isn't skipped by the guard.
      const detail = await res.text();
      await payload.update({
        collection: 'events',
        id: eventId,
        data: { [sentField]: null },
        context: { skipStripeSync: true },
      });
      throw new Error(`Resend broadcast ${res.status}: ${detail}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    await logtail.error(
      `API /tasks/send-broadcast: ${kind} failed for event ${eventId}: ${err}`,
      { method: 'POST', timestamp: new Date().toISOString() }
    );
    return NextResponse.json({ error: 'Broadcast failed' }, { status: 500 });
  }
}
