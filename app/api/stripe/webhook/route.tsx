import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { headers } from 'next/headers';
import { logtail } from '@/lib/logtail';
import { stripe, stripeCheckout } from '@/lib/stripe';
import { qstash, QSTASH_TARGET_BASE_URL } from '@/lib/qstash';
import { addResendContact } from '@/lib/resend';

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
          where: { paymentIntentId: { equals: pi.id } },
        });
        if (existingOrders.length > 0) {
          await logtail.info(
            `API /stripe/webhook: Duplicate payment_intent ${pi.id} received. Ignoring.`
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

        if (event_?.id) {
          await payload.update({
            collection: 'events',
            id: event_.id,
            data: { ticketsSold: (event_.ticketsSold ?? 0) + quantity },
          });
        } else if (merch_?.id) {
          await payload.update({
            collection: 'merch',
            id: merch_.id,
            data: { merchSold: (merch_.merchSold ?? 0) + quantity },
          });
        }

        // Ticket email — events only. Enqueued to QStash so delivery is durable
        // (retried on failure, dead-lettered + alerted if exhausted) and can't be
        // swallowed by this webhook request. The task does the OMDB poster lookup
        // and Resend send; see app/api/tasks/send-ticket-email.
        if (newOrder.id && event_?.id && email) {
          try {
            await qstash.publishJSON({
              url: `${QSTASH_TARGET_BASE_URL}/api/tasks/send-ticket-email`,
              body: { orderId: newOrder.id, email },
              deduplicationId: `ticket-email-${pi.id}`,
              retries: 3,
              failureCallback: `${QSTASH_TARGET_BASE_URL}/api/tasks/send-ticket-email/failure`,
            });
          } catch (enqueueErr) {
            // Payment is captured and the order recorded; don't fail the webhook.
            // Log so a missed enqueue is visible (still far more reliable than the
            // previous inline send).
            await logtail.error(
              `API /stripe/webhook: failed to enqueue ticket email for order ${newOrder.id}: ${enqueueErr}`,
              { method: 'POST', timestamp: new Date().toISOString() }
            );
          }
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
          });
        }

        // Send the refund-confirmation email via the queue (durable + retried).
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
