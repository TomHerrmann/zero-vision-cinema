import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { Resend } from 'resend';
import { logtail } from '@/lib/logtail';
import { verifyQstashRequest } from '@/lib/qstash';
import { ZVC_EMAIL_ADDRESS } from '@/app/contsants/constants';
import { fetchMovieDataByImdbId } from '@/lib/omdb';
import TicketEmail from '@/emails/TicketEmail';
import type { Event, Location, Media } from '@/payload-types';

const resend = new Resend(process.env.RESEND_API_KEY);

type Body = { orderId?: number; email?: string };

/**
 * QStash-delivered background task: send the post-purchase ticket email.
 *
 * Enqueued by the Stripe webhook (`payment_intent.succeeded`) after the order is
 * recorded, so the flaky bits — the OMDB poster lookup and the Resend send —
 * happen here with QStash retries instead of inline where a transient failure
 * would be swallowed and the buyer would never get their ticket.
 *
 * Contract with QStash:
 *  - 2xx  → done, no retry (also returned for already-sent/no-event, which are
 *           not retryable).
 *  - 4xx  → bad/again-unusable input, no retry.
 *  - 5xx / throw → retried; on exhaustion QStash calls the failureCallback.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await verifyQstashRequest<Body>(req);
  } catch (err) {
    await logtail.error(
      `API /tasks/send-ticket-email: signature verification failed: ${err}`
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orderId, email } = body;
  if (!orderId || !email) {
    await logtail.error(
      `API /tasks/send-ticket-email: missing orderId or email`,
      { orderId, email }
    );
    return NextResponse.json(
      { error: 'Missing orderId or email' },
      { status: 400 }
    );
  }

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
        `API /tasks/send-ticket-email: order ${orderId} not found`
      );
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Idempotency — QStash delivers at least once.
    if (order.ticketEmailSentAt) {
      await logtail.info(
        `API /tasks/send-ticket-email: order ${orderId} already emailed. Skipping.`
      );
      return NextResponse.json(
        { received: true, skipped: true },
        { status: 200 }
      );
    }

    // Ticket emails are for event purchases only. depth: 1 resolves image + location.
    const eventDocs = await payload.find({
      collection: 'events',
      disableErrors: true,
      limit: 1,
      depth: 1,
      where: { productId: { equals: order.productId } },
    });
    const event_ = eventDocs.docs[0] as Event | undefined;
    if (!event_?.id) {
      // No matching event (merch order, or the event was removed). Nothing to
      // email — mark done so QStash stops retrying.
      await payload.update({
        collection: 'orders',
        id: orderId,
        data: { ticketEmailSentAt: new Date().toISOString() },
      });
      return NextResponse.json(
        { received: true, noEvent: true },
        { status: 200 }
      );
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
      subject: `Your ZVC Ticket: ${event_.name}`,
      to: email,
      react: (
        <TicketEmail
          eventName={event_.name}
          eventImage={posterUrl}
          eventDate={event_.datetime}
          eventLocation={location.name}
          quantity={order.quantity}
          eventDescription={event_.description ?? undefined}
          eventAddress={location.address}
          totalAmount={order.amountPaid}
          purchaseDate={order.transactionDate}
        />
      ),
    });

    // Resend reports API failures on the returned object rather than throwing —
    // surface it as a 500 so QStash retries.
    if (sendError) {
      throw new Error(
        `Resend error: ${sendError.message ?? JSON.stringify(sendError)}`
      );
    }

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: { ticketEmailSentAt: new Date().toISOString() },
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    // Non-2xx → QStash retries; on exhaustion it hits the failure callback.
    await logtail.error(
      `API /tasks/send-ticket-email: send failed for order ${orderId}: ${err}`,
      { method: 'POST', timestamp: new Date().toISOString() }
    );
    return NextResponse.json(
      { error: 'Failed to send ticket email' },
      { status: 500 }
    );
  }
}
