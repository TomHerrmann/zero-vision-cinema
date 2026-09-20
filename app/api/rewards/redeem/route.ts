import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { stripeCheckout } from '@/lib/stripe';
import { logtail } from '@/lib/logtail';
import { enqueueTicketEmail } from '@/lib/tasks';
import {
  claimReward,
  findUsableReward,
  releaseRewardClaim,
} from '@/lib/loyalty';
import type { Location } from '@/payload-types';

const SOURCE = 'API /rewards/redeem';
const INVALID_CODE_MESSAGE = 'That code is invalid, expired, or already used.';

/** Stripe customer ids for an email. Stripe's email filter is case-sensitive. */
async function customerIdsForEmail(email: string): Promise<Set<string>> {
  const variants = Array.from(new Set([email, email.toLowerCase()]));
  const lists = await Promise.all(
    variants.map((e) => stripeCheckout.customers.list({ email: e, limit: 10 }))
  );
  return new Set(lists.flatMap((l) => l.data.map((c) => c.id)));
}

/**
 * Claim one free ticket with a loyalty reward code. No payment is taken: this
 * records a $0 order, counts the seat, and enqueues the ticket email — the same
 * fulfillment the Stripe webhook does for paid orders.
 *
 * Only the person who earned the code can use it: the email entered must belong
 * to the Stripe customer the reward was issued to. The code is claimed with an
 * atomic update, so it can't be spent twice.
 */
export async function POST(req: NextRequest) {
  try {
    const { eventId, code, email: rawEmail } = await req.json();
    const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';

    if (!eventId || typeof code !== 'string' || !email) {
      return NextResponse.json(
        { error: 'Enter your code and the email you bought your tickets with.' },
        { status: 400 }
      );
    }

    const payload = await getPayload({ config: payloadConfig });

    const reward = await findUsableReward(payload, code);
    if (!reward) {
      return NextResponse.json({ error: INVALID_CODE_MESSAGE }, { status: 400 });
    }

    const owners = await customerIdsForEmail(email);
    if (!owners.has(reward.customerId)) {
      return NextResponse.json(
        {
          error:
            "This code doesn't match that email. Use the email address you bought your tickets with.",
        },
        { status: 403 }
      );
    }

    const event = await payload.findByID({
      collection: 'events',
      id: eventId,
      depth: 1,
      disableErrors: true,
    });
    const location = event?.location as Location | undefined;
    const price = event?.price ?? 0;
    if (!event || !event.productId || !(price > 0)) {
      return NextResponse.json(
        { error: 'This event is not available.' },
        { status: 400 }
      );
    }
    if (location?.capacity && location.capacity - (event.ticketsSold ?? 0) <= 0) {
      return NextResponse.json({ error: 'Sold out' }, { status: 409 });
    }

    if (!(await claimReward(payload, reward.id))) {
      return NextResponse.json({ error: INVALID_CODE_MESSAGE }, { status: 409 });
    }

    let order;
    try {
      order = await payload.create({
        collection: 'orders',
        data: {
          customerId: reward.customerId,
          productId: event.productId,
          price,
          amountPaid: 0,
          quantity: 1,
          transactionDate: new Date().toISOString(),
          item: { relationTo: 'events', value: event.id },
          redeemedReward: reward.id,
        },
      });
    } catch (createErr) {
      // Give the code back so the buyer can try again.
      await releaseRewardClaim(payload, reward.id);
      throw createErr;
    }

    await payload.update({
      collection: 'rewards',
      id: reward.id,
      data: { redeemedOrder: order.id },
    });

    // Seat count: never fatal (same reasoning as the webhook) — log it.
    try {
      await payload.update({
        collection: 'events',
        id: event.id,
        data: { ticketsSold: (event.ticketsSold ?? 0) + 1 },
        context: { skipStripeSync: true },
      });
    } catch (countErr) {
      await logtail.error(
        `${SOURCE}: failed to update sold count for order ${order.id}: ${countErr}`,
        { method: 'POST', timestamp: new Date().toISOString() }
      );
    }

    const enqueued = await enqueueTicketEmail({
      orderId: order.id,
      dedupKey: `reward-${reward.id}`,
      email,
      source: SOURCE,
    });
    if (!enqueued) {
      // The ticket is recorded; only the email is outstanding. Surface it so it
      // can be resent (scripts/repair-stranded-orders).
      await logtail.error(
        `${SOURCE}: free order ${order.id} recorded but ticket email not enqueued`
      );
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch (err) {
    await logtail.error(`${SOURCE} failed: ${err}`, {
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Could not claim your free ticket. Please email us.' },
      { status: 500 }
    );
  }
}
