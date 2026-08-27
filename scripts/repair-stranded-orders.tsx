/**
 * Repair orders that were paid and recorded but never fulfilled: send the
 * ticket email that was lost, and correct the event's `ticketsSold`.
 *
 *   npm run orders:repair -- --orders 1116,1117,1118,1119 --dry-run
 *   npm run orders:repair -- --orders 1116,1117,1118,1119 --send
 *   npm run orders:repair -- --orders 1116,1117,1118,1119 --send --fix-counts
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
 * `--fix-counts` sets each affected event's `ticketsSold` to the sum of its
 * non-refunded order quantities, rather than incrementing, so running twice is a
 * no-op. Read the "current → computed" line in the dry run before trusting it:
 * if you have comped seats that aren't backed by an order, the computed total
 * will be lower than the truth and you should skip the flag.
 *
 * ⚠️ --send mails real buyers. Always --dry-run first and read back the list.
 */
import { getPayload } from 'payload';
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
  const ids = (arg('orders') ?? '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);

  if (ids.length === 0) {
    console.error(
      'usage: --orders <id,id,…> [--send] [--fix-counts]\n' +
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
  console.log(`counts  ${fixCounts ? 'will be corrected' : 'left alone'}`);
  console.log(`target  ${TASK_URL}`);
  console.log('');

  const payload = await getPayload({ config: payloadConfig });

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

    if (send) {
      await qstash.publishJSON({
        url: TASK_URL,
        // No `email`: the task resolves it from the order's Stripe customer.
        // This script runs on a laptop and deliberately holds no live Stripe
        // credentials — production already has them.
        body: { orderId: order.id },
        // Same key the webhook would have used, so a message it did manage to
        // publish is not duplicated by this repair.
        deduplicationId: `ticket-email-${order.paymentIntentId}`,
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

    console.log(
      `event ${eventId} "${event_.name}": ticketsSold ${event_.ticketsSold ?? 0} ` +
        `→ ${computed} (${shortfall} uncounted in this batch)`
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
