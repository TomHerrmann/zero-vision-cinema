import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { headers } from 'next/headers';
import { logtail } from '@/lib/logtail';
import { stripe, stripeCheckout } from '@/lib/stripe';
import { qstash, QSTASH_TARGET_BASE_URL } from '@/lib/qstash';
import { addResendContact } from '@/lib/resend';

/**
 * Enqueue the ticket-email task for an order. Returns false (rather than
 * throwing) when QStash refuses the message, so the caller can decide whether
 * to fail the webhook and let Stripe retry.
 *
 * `deduplicationId` is keyed on the PaymentIntent so a redelivery — Stripe's or
 * ours — can't double-publish; the task's `ticketEmailSentAt` guard covers the
 * same ground once QStash's dedup window has passed.
 */
async function enqueueTicketEmail({
  orderId,
  paymentIntentId,
  email,
}: {
  orderId: number;
  paymentIntentId: string;
  email?: string;
}): Promise<boolean> {
  try {
    await qstash.publishJSON({
      url: `${QSTASH_TARGET_BASE_URL}/api/tasks/send-ticket-email`,
      // Without `email` the task resolves it from the order's Stripe customer.
      body: email ? { orderId, email } : { orderId },
      deduplicationId: `ticket-email-${paymentIntentId}`,
      retries: 3,
      failureCallback: `${QSTASH_TARGET_BASE_URL}/api/tasks/send-ticket-email/failure`,
    });
    return true;
  } catch (enqueueErr) {
    await logtail.error(
      `API /stripe/webhook: failed to enqueue ticket email for order ${orderId}: ${enqueueErr}`,
      { method: 'POST', timestamp: new Date().toISOString() }
    );
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const sig = (await headers()).get('stripe-signature');

    if (!sig) {
      await logtail.error(`API /stripe/webhook Missing Stripe signature`, {
        method: 'POST',
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    const rawBody = await req.text();

    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const payload = await getPayload({ config: payloadConfig });
        const pi = event.data.object as Stripe.PaymentIntent;

        // Idempotency — this event can be delivered more than once.
        const { docs: existingOrders } = await payload.find({
          collection: 'orders',
          depth: 0,
          limit: 1,
          where: { paymentIntentId: { equals: pi.id } },
        });
        const existingOrder = existingOrders[0];
        if (existingOrder) {
          // The order is already recorded, but "recorded" doesn't mean
          // "fulfilled": if the enqueue below failed the first time round (bad
          // QStash credentials, an Upstash outage), returning 200 here strands
          // the buyer permanently — Stripe never retries a 200. So retry the
          // enqueue instead, which makes both Stripe's automatic redeliveries
          // and a manual "Resend" from the dashboard repair the order.
          const needsTicketEmail =
            !existingOrder.ticketEmailSentAt &&
            !existingOrder.refundedAt &&
            existingOrder.item?.relationTo === 'events';

          if (!needsTicketEmail) {
            await logtail.info(
              `API /stripe/webhook: Duplicate payment_intent ${pi.id} received. Ignoring.`
            );
            return NextResponse.json({ received: true }, { status: 200 });
          }

          // No `email`: the charge's address isn't refetched here, so the task
          // resolves it from the order's Stripe customer.
          const requeued = await enqueueTicketEmail({
            orderId: existingOrder.id,
            paymentIntentId: pi.id,
          });
          if (!requeued) {
            return NextResponse.json(
              { error: 'Failed to enqueue ticket email' },
              { status: 500 }
            );
          }

          await logtail.info(
            `API /stripe/webhook: Duplicate payment_intent ${pi.id} received; re-enqueued the unsent ticket email for order ${existingOrder.id}.`
          );
          return NextResponse.json({ received: true }, { status: 200 });
        }

        const productId = pi.metadata?.productId;
        const quantity = Number(pi.metadata?.quantity ?? '1');
        const unitPrice = Number(pi.metadata?.unit_price ?? '0');
        const newsletterOptin = pi.metadata?.newsletter_optin === 'true';

        if (!productId) {
          await logtail.error(
            `API /stripe/webhook: payment_intent ${pi.id} missing productId metadata`
          );
          return NextResponse.json(
            { error: 'Missing product metadata' },
            { status: 400 }
          );
        }

        // Expand the latest charge for the receipt URL and billing details.
        const full = await stripeCheckout.paymentIntents.retrieve(pi.id, {
          expand: ['latest_charge'],
        });
        const charge = (full.latest_charge as Stripe.Charge) ?? null;
        const receiptUrl = charge?.receipt_url ?? null;
        const email =
          charge?.billing_details?.email ?? full.receipt_email ?? null;
        const name = charge?.billing_details?.name ?? undefined;

        if (!receiptUrl) {
          await logtail.error(
            `API /stripe/webhook: No receipt for payment_intent ${pi.id}`
          );
          return NextResponse.json(
            { error: 'Missing receipt for payment intent: ' + pi.id },
            { status: 400 }
          );
        }

        // Resolve the Stripe customer: reuse the PaymentIntent's customer if
        // present, otherwise look one up by email (dedupes repeat buyers) and
        // reuse it, or create a new one.
        let customerId: string | null =
          typeof full.customer === 'string'
            ? full.customer
            : (full.customer?.id ?? null);
        if (!customerId && email) {
          const existing = await stripeCheckout.customers.list({
            email,
            limit: 1,
          });
          customerId =
            existing.data[0]?.id ??
            (await stripeCheckout.customers.create({ email, name })).id;
        }

        if (!customerId) {
          await logtail.error(
            `API /stripe/webhook: no customer or email for payment_intent ${pi.id}`
          );
          return NextResponse.json(
            { error: 'Missing customer for payment intent: ' + pi.id },
            { status: 400 }
          );
        }

        // Newsletter opt-in captured on our ticket page (PaymentIntent metadata).
        if (newsletterOptin && email) {
          const firstName = name?.split(' ')[0] ?? undefined;
          const lastName = name?.split(' ').slice(1).join(' ') || undefined;
          try {
            await addResendContact({ email, firstName, lastName });
          } catch (subErr) {
            await logtail.error(
              `API /stripe/webhook: newsletter opt-in failed for ${email}: ${subErr}`
            );
          }
        }

        const amountPaid = full.amount_received; // cents
        const transactionDate = new Date(full.created * 1000).toISOString();

        // Resolve the purchased item (event or merch) — without mutating any
        // sold counts yet, so a failed order insert can't inflate them.
        const eventDocs = await payload.find({
          collection: 'events',
          disableErrors: true,
          limit: 1,
          where: { productId: { equals: productId } },
        });
        const event_ = eventDocs.docs[0];

        let item;
        let merch_;
        if (event_?.id) {
          item = { relationTo: 'events' as const, value: event_.id };
        } else {
          const merchDocs = await payload.find({
            collection: 'merch',
            disableErrors: true,
            where: { productId: { equals: productId } },
          });
          merch_ = merchDocs.docs[0];

          if (merch_?.id) {
            item = { relationTo: 'merch' as const, value: merch_.id };
          } else {
            await logtail.error(
              `API /stripe/webhook failed to find event or merch. Check stripe for product ID: ${productId}`,
              { method: 'POST', timestamp: new Date().toISOString() }
            );
            return NextResponse.json(
              {
                error:
                  'Failed to find event or merch. Check stripe for product ID: ' +
                  productId,
              },
              { status: 400 }
            );
          }
        }

        // Create the order first; only bump the sold count once it succeeds.
        const newOrder = await payload.create({
          collection: 'orders',
          data: {
            paymentIntentId: pi.id,
            customerId,
            amountPaid: (amountPaid ?? 0) / 100,
            transactionDate,
            productId,
            receiptUrl,
            quantity,
            price: unitPrice,
            item,
          },
        });

        // Set when QStash refused the message. Reported as a 500 *after* the
        // sold count is updated below, so Stripe retries the whole event and
        // the duplicate branch above gets another chance at the enqueue.
        let enqueueFailed = false;

        // Ticket email — events only. Enqueued to QStash so delivery is durable
        // (retried on failure, dead-lettered + alerted if exhausted) and can't be
        // swallowed by this webhook request. The task does the OMDB poster lookup
        // and Resend send; see app/api/tasks/send-ticket-email.
        if (newOrder.id && event_?.id) {
          // Last-resort fallback: if the charge carried no email (e.g. a wallet
          // that didn't share one), fall back to the Stripe customer's email so
          // the buyer still gets their ticket.
          let ticketEmail = email;
          if (!ticketEmail) {
            const cust = await stripeCheckout.customers
              .retrieve(customerId)
              .catch(() => null);
            if (cust && !('deleted' in cust && cust.deleted)) {
              ticketEmail = (cust as Stripe.Customer).email ?? null;
            }
          }

          if (!ticketEmail) {
            // No deliverable address anywhere — the order is recorded, but the
            // buyer can't be emailed. Log loudly so this is visible and can be
            // handled manually (rather than silently skipped as before).
            await logtail.error(
              `API /stripe/webhook: no email for order ${newOrder.id} (payment_intent ${pi.id}); ticket email NOT sent`,
              { method: 'POST', timestamp: new Date().toISOString() }
            );
          } else {
            enqueueFailed = !(await enqueueTicketEmail({
              orderId: newOrder.id,
              paymentIntentId: pi.id,
              email: ticketEmail,
            }));
          }
        }

        // Sold counts last, and never fatal: the buyer is already paid, recorded
        // and emailed, so a failure here must not 400 the webhook. It isn't
        // retryable either — Stripe's redelivery short-circuits on the
        // idempotency check above — so log it for manual correction instead.
        try {
          if (event_?.id) {
            await payload.update({
              collection: 'events',
              id: event_.id,
              data: { ticketsSold: (event_.ticketsSold ?? 0) + quantity },
              context: { skipStripeSync: true },
            });
          } else if (merch_?.id) {
            await payload.update({
              collection: 'merch',
              id: merch_.id,
              data: { merchSold: (merch_.merchSold ?? 0) + quantity },
            });
          }
        } catch (countErr) {
          await logtail.error(
            `API /stripe/webhook: failed to update sold count for order ${newOrder.id} (payment_intent ${pi.id}): ${countErr}`,
            { method: 'POST', timestamp: new Date().toISOString() }
          );
        }

        // Everything durable is written; the only thing missing is the queued
        // ticket email. Fail the webhook so Stripe redelivers (for up to ~3
        // days) rather than losing the buyer's ticket to a log line.
        if (enqueueFailed) {
          return NextResponse.json(
            { error: 'Failed to enqueue ticket email' },
            { status: 500 }
          );
        }

        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        // Only handle FULL refunds — `charge.refunded` also fires for partial
        // refunds (which shouldn't invalidate the whole ticket / free the seat).
        if (!charge.refunded) break;
        const paymentIntentId =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : (charge.payment_intent?.id ?? null);
        if (!paymentIntentId) break;

        const payload = await getPayload({ config: payloadConfig });
        const { docs } = await payload.find({
          collection: 'orders',
          where: { paymentIntentId: { equals: paymentIntentId } },
          limit: 1,
        });
        const order = docs[0];
        if (!order || order.refundedAt) break;

        await payload.update({
          collection: 'orders',
          id: order.id,
          data: { refundedAt: new Date().toISOString() },
        });

        // Enqueue the refund-confirmation email first (durable + retried), before
        // the seat-count update — so a failure there (which would 400 → Stripe
        // retry → idempotency short-circuit) can't swallow the email.
        try {
          await qstash.publishJSON({
            url: `${QSTASH_TARGET_BASE_URL}/api/tasks/send-refund-email`,
            body: { orderId: order.id },
            deduplicationId: `refund-email-${paymentIntentId}`,
            retries: 3,
            failureCallback: `${QSTASH_TARGET_BASE_URL}/api/tasks/send-refund-email/failure`,
          });
        } catch (enqueueErr) {
          await logtail.error(
            `API /stripe/webhook: failed to enqueue refund email for order ${order.id}: ${enqueueErr}`,
            { method: 'POST', timestamp: new Date().toISOString() }
          );
        }

        // Free the seat: decrement the event's ticketsSold (floor at 0).
        const refundedEvents = await payload.find({
          collection: 'events',
          disableErrors: true,
          limit: 1,
          where: { productId: { equals: order.productId } },
        });
        const refundedEvent = refundedEvents.docs[0];
        if (refundedEvent?.id) {
          await payload.update({
            collection: 'events',
            id: refundedEvent.id,
            data: {
              ticketsSold: Math.max(
                0,
                (refundedEvent.ticketsSold ?? 0) - order.quantity
              ),
            },
            context: { skipStripeSync: true },
          });
        }
        break;
      }
    }
  } catch (err) {
    await logtail.error(`API /stripe/webhook failed: ${err}`, {
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Stripe webhook failed.', err },
      { status: 400 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
