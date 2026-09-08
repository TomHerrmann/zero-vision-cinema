/**
 * Repair orders that were paid and recorded but never fulfilled: send the
 * ticket email that was lost, and correct the event's `ticketsSold`.
 *
 *   npm run orders:repair -- --all                        # dry run: what's stranded
 *   npm run orders:repair -- --all --send
 *   npm run orders:repair -- --orders 1116,1117 --send --fix-counts
 *
 * `--all` finds the work itself: every order for an *upcoming* event that has
 * no `ticketEmailSentAt` and isn't refunded. `--orders` names them explicitly
 * instead. One or the other is required — there is no bare-run default.
 *
 * Two bugs stranded these: purchases before `fce25ff` silently skipped the
 * enqueue when the charge carried no email, and purchases after `953ada6` threw
 * on the `ticketsSold` update — which sat before the enqueue — and aborted the
 * webhook mid-fulfillment. Stripe's redelivery can't repair either, because the
 * webhook's idempotency guard sees the order already exists and returns 200.
 *
 * Emails go through QStash to /api/tasks/send-ticket-email exactly as the
 * webhook would, so they get the same signature check, retries, failure
 * callback, and — importantly — the same `ticketEmailSentAt` guard. An order
 * that was already emailed is skipped by the task itself, so a re-run cannot
 * double-send.
 *
 * Orders for events that have already happened are skipped: the email is a
 * ticket first and a receipt second, and it carries a live refund link, so
 * mailing one after the show is confusing at best. Their seat counts are still
 * reconciled. `--include-past` mails them anyway — only for a show that has
 * just passed and whose buyers you actually owe a receipt.
 *
 * `--fix-counts` sets each affected event's `ticketsSold` to the sum of its
 * non-refunded order quantities, rather than incrementing, so running twice is a
 * no-op. Read the "current → computed" line in the dry run before trusting it:
 * if you have comped seats that aren't backed by an order, the computed total
 * will be lower than the truth and you should skip the flag.
 *
 * ⚠️ --send mails real buyers. Always --dry-run first and read back the list.
 */
import { getPayload, type Where } from 'payload';
import payloadConfig from '@/payload.config';
import { qstash, QSTASH_TARGET_BASE_URL } from '@/lib/qstash';
import type { Order } from '@/payload-types';

const TASK_URL = `${QSTASH_TARGET_BASE_URL}/api/tasks/send-ticket-email`;
const FAILURE_URL = `${QSTASH_TARGET_BASE_URL}/api/tasks/send-ticket-email/failure`;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main() {
  const send = process.argv.includes('--send');
  const fixCounts = process.argv.includes('--fix-counts');
  const includePast = process.argv.includes('--include-past');
  const all = process.argv.includes('--all');
  const ids = (arg('orders') ?? '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);

  if (ids.length === 0 && !all) {
    console.error(
      'usage: (--orders <id,id,…> | --all) [--send] [--fix-counts] [--include-past]\n' +
        '  --all         every unfulfilled order for an upcoming event\n' +
        '  --orders      only these order ids\n' +
        'Without --send this is a dry run and writes nothing.'
    );
    process.exit(2);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(
      'Refusing to run without NODE_ENV=production — Payload would try to push\n' +
        'schema changes to the target database. Use `npm run orders:repair`.'
    );
    process.exit(1);
  }

  console.log(`mode    ${send ? 'SEND' : 'DRY RUN'}`);
  console.log(`orders  ${ids.length ? `explicit: ${ids.join(', ')}` : 'discovered from the database (--all)'}`);
  console.log(`counts  ${fixCounts ? 'will be corrected' : 'left alone'}`);
  console.log(
    `past    ${includePast ? '⚠️  WILL be mailed (--include-past)' : 'skipped — events that already happened get no email'}`
  );
  console.log(`target  ${TASK_URL}`);
  console.log('');

  const payload = await getPayload({ config: payloadConfig });

  // --all: find the stranded orders rather than being handed them. Scoped to
  // events that haven't happened yet — every order predating the
  // `ticketEmailSentAt` column reads as unfulfilled, so an unscoped query would
  // sweep up the site's entire order history. `--include-past` widens it to all
  // events, and then the per-order guard below is what holds the line.
  if (ids.length === 0) {
    let where: Where = {
      ticketEmailSentAt: { exists: false },
      refundedAt: { exists: false },
    };

    if (!includePast) {
      const { docs: upcoming } = await payload.find({
        collection: 'events',
        depth: 0,
        limit: 500,
        where: { datetime: { greater_than: new Date().toISOString() } },
      });
      const productIds = upcoming
        .map((e) => e.productId)
        .filter((p): p is string => Boolean(p));

      console.log(
        `upcoming events: ${upcoming.length} (${productIds.length} with a Stripe product)`
      );
      if (productIds.length === 0) {
        console.log('nothing to repair — no upcoming event sells tickets.');
        return;
      }
      where = { ...where, productId: { in: productIds } };
    }

    const { docs: stranded } = await payload.find({
      collection: 'orders',
      depth: 0,
      limit: 1000,
      sort: 'id',
      where,
    });
    ids.push(...stranded.map((o) => o.id));

    console.log(
      `found ${ids.length} unfulfilled order(s)` +
        (ids.length ? `: ${ids.join(', ')}` : '')
    );
    console.log('');
    if (ids.length === 0) return;
  }

  // Event id → quantity we are repairing, used only to report the shortfall.
  const touchedEvents = new Map<number, number>();
  let emailed = 0;
  let skipped = 0;

  for (const id of ids) {
    const order = (await payload.findByID({
      collection: 'orders',
      id,
      depth: 0,
      disableErrors: true,
    })) as Order | null;

    if (!order) {
      console.log(`order ${id}  MISSING — no such order, skipping`);
      skipped++;
      continue;
    }
    if (order.ticketEmailSentAt) {
      console.log(
        `order ${id}  SKIP — already emailed at ${order.ticketEmailSentAt}`
      );
      skipped++;
      continue;
    }
    if (order.refundedAt) {
      console.log(`order ${id}  SKIP — refunded at ${order.refundedAt}`);
      skipped++;
      continue;
    }

    const { docs: eventDocs } = await payload.find({
      collection: 'events',
      disableErrors: true,
      limit: 1,
      depth: 0,
      where: { productId: { equals: order.productId } },
    });
    const event_ = eventDocs[0];
    if (!event_?.id) {
      console.log(
        `order ${id}  SKIP — no event for productId ${order.productId}`
      );
      skipped++;
      continue;
    }

    console.log(
      `order ${id}  event ${event_.id} "${event_.name}" ` +
        `(${event_.datetime})  qty ${order.quantity}  $${order.amountPaid}  ` +
        `customer ${order.customerId}`
    );

    // Count the seat even when the address can't be recovered — the seat was
    // never counted either way, and that shortfall is independent of delivery.
    touchedEvents.set(
      event_.id,
      (touchedEvents.get(event_.id) ?? 0) + order.quantity
    );

    // Don't mail a ticket for a show that has already happened. An unparseable
    // datetime counts as past: if we can't tell, don't send. The seat count
    // above is still reconciled — that's independent of delivery.
    const startsAt = new Date(event_.datetime).getTime();
    if (!includePast && !(startsAt > Date.now())) {
      console.log(
        `  SKIP — event already happened; --include-past mails it anyway`
      );
      skipped++;
      continue;
    }

    if (send) {
      await qstash.publishJSON({
        url: TASK_URL,
        // No `email`: the task resolves it from the order's Stripe customer.
        // This script runs on a laptop and deliberately holds no live Stripe
        // credentials — production already has them.
        body: { orderId: order.id },
        // Same key the webhook would have used, so a message it did manage to
        // publish is not duplicated by this repair.
        // Falls back to the order id: an order with no paymentIntentId (the
        // older checkout-session shape) would otherwise key every message to
        // `ticket-email-null`, and QStash would drop all but the first.
        deduplicationId: order.paymentIntentId
          ? `ticket-email-${order.paymentIntentId}`
          : `ticket-email-order-${order.id}`,
        retries: 3,
        failureCallback: FAILURE_URL,
      });
    }
    emailed++;
  }

  console.log('');
  console.log(`${send ? 'enqueued' : 'would enqueue'} ${emailed}, skipped ${skipped}`);

  // Seat counts. Computed from the orders themselves rather than incremented,
  // so this is idempotent and a second run changes nothing.
  for (const [eventId, shortfall] of touchedEvents) {
    const event_ = await payload.findByID({
      collection: 'events',
      id: eventId,
      depth: 0,
      disableErrors: true,
    });
    if (!event_) continue;

    const { docs: allOrders } = await payload.find({
      collection: 'orders',
      depth: 0,
      limit: 1000,
      where: {
        productId: { equals: event_.productId },
        refundedAt: { exists: false },
      },
    });
    const computed = allOrders.reduce((sum, o) => sum + (o.quantity ?? 0), 0);

    // Whether the seats in this batch were counted depends on which bug
    // stranded them: a failed *enqueue* leaves the count correct (the webhook
    // bumps it afterwards, non-fatally), while a throw in the count update
    // itself leaves it short. Report the actual delta rather than assuming.
    const current = event_.ticketsSold ?? 0;
    const delta = computed - current;
    console.log(
      `event ${eventId} "${event_.name}": ticketsSold ${current} → ${computed} ` +
        (delta === 0
          ? `(already correct; this batch's ${shortfall} seat(s) were counted — --fix-counts would be a no-op)`
          : `(off by ${delta}; ${shortfall} seat(s) in this batch)`)
    );

    if (send && fixCounts && computed !== (event_.ticketsSold ?? 0)) {
      await payload.update({
        collection: 'events',
        id: eventId,
        data: { ticketsSold: computed },
        // Events 51/52 carry payment links that no longer exist in Stripe, so
        // the beforeChange sync would throw and abort this repair. Nothing
        // Stripe mirrors is changing here.
        context: { skipStripeSync: true },
      });
      console.log(`  updated`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
