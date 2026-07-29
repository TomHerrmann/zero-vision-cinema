import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { Resend } from 'resend';
import { logtail } from '@/lib/logtail';
import { verifyQstashRequest } from '@/lib/qstash';
import { getCustomerEmail } from '@/lib/stripe';
import { ZVC_EMAIL_ADDRESS, ZVC_SITE_URL } from '@/app/contsants/constants';
import { fetchMovieDataByImdbId } from '@/lib/omdb';
import EventReminderEmail, {
  type ReminderKind,
} from '@/emails/EventReminderEmail';
import type { Event, Location, Media } from '@/payload-types';

const resend = new Resend(process.env.RESEND_API_KEY);

type Body = { orderId?: number; kind?: ReminderKind };

const SENT_FIELD = {
  'pre-event': 'preEventEmailSentAt',
  'day-of': 'dayOfEmailSentAt',
} as const;

const SUBJECT = {
  'pre-event': (name: string) => `Coming up: ${name} — Zero Vision Cinema`,
  'day-of': (name: string) => `Tonight: ${name} — Zero Vision Cinema`,
};

/**
 * QStash-delivered background task: send an event reminder (pre-event or day-of).
 * Scheduled at purchase (see app/api/stripe/webhook) with a `notBefore` delay.
 * Same delivery contract as the ticket-email task: 2xx = done (incl. skips),
 * 5xx/throw = retried, then the failure callback fires.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await verifyQstashRequest<Body>(req);
  } catch (err) {
    await logtail.error(
      `API /tasks/send-event-reminder: signature verification failed: ${err}`
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orderId, kind } = body;
  if (!orderId || (kind !== 'pre-event' && kind !== 'day-of')) {
    await logtail.error(
      `API /tasks/send-event-reminder: bad payload`,
      { orderId, kind }
    );
    return NextResponse.json({ error: 'Bad payload' }, { status: 400 });
  }

  const sentField = SENT_FIELD[kind];

  try {
    const payload = await getPayload({ config: payloadConfig });

    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
      disableErrors: true,
    });
    if (!order) {
      await logtail.error(
        `API /tasks/send-event-reminder: order ${orderId} not found`
      );
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Skip (200, no retry) if already sent or the order was refunded.
    if (order[sentField] || order.refundedAt) {
      return NextResponse.json({ received: true, skipped: true }, { status: 200 });
    }

    const eventDocs = await payload.find({
      collection: 'events',
      disableErrors: true,
      limit: 1,
      depth: 1,
      where: { productId: { equals: order.productId } },
    });
    const event_ = eventDocs.docs[0] as Event | undefined;

    // No event, or the event is already over → nothing to remind about. Mark
    // done so QStash stops retrying.
    if (!event_?.id || new Date(event_.datetime).getTime() < Date.now()) {
      await payload.update({
        collection: 'orders',
        id: orderId,
        data: { [sentField]: new Date().toISOString() },
      });
      return NextResponse.json({ received: true, skipped: true }, { status: 200 });
    }

    // Resolve the buyer's email from Stripe (we store the customer id, not the
    // email). A missing email is permanent → mark done; a Stripe error throws
    // and is retried by the catch below.
    const email = await getCustomerEmail(order.customerId);
    if (!email) {
      await payload.update({
        collection: 'orders',
        id: orderId,
        data: { [sentField]: new Date().toISOString() },
      });
      return NextResponse.json({ received: true, skipped: true }, { status: 200 });
    }

    // Poster: uploaded blob image if present, else the OMDB poster URL.
    const image =
      typeof event_.image === 'object' ? (event_.image as Media) : null;
    let posterUrl = image?.filename
      ? `${process.env.VERCEL_BLOB_URL}${image.filename}`
      : undefined;
    if (!posterUrl && event_.imdbId) {
      const movie = await fetchMovieDataByImdbId(event_.imdbId);
      posterUrl = movie?.poster || undefined;
    }

    const location = event_.location as Location;

    const { error: sendError } = await resend.emails.send({
      from: ZVC_EMAIL_ADDRESS,
      subject: SUBJECT[kind](event_.name),
      to: email,
      react: (
        <EventReminderEmail
          kind={kind}
          eventName={event_.name}
          eventImage={posterUrl}
          eventDate={event_.datetime}
          eventLocation={location.name}
          eventAddress={location.address}
          eventUrl={`${ZVC_SITE_URL}/events/${event_.id}`}
        />
      ),
    });
    if (sendError) {
      throw new Error(
        `Resend error: ${sendError.message ?? JSON.stringify(sendError)}`
      );
    }

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: { [sentField]: new Date().toISOString() },
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    await logtail.error(
      `API /tasks/send-event-reminder: ${kind} send failed for order ${orderId}: ${err}`,
      { method: 'POST', timestamp: new Date().toISOString() }
    );
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    );
  }
}
