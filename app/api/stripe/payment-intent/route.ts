import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { stripeCheckout } from '@/lib/stripe';
import { logtail } from '@/lib/logtail';
import { formatAmountForStripe } from '@/utils/stripeUtils';
import type { Event, Location } from '@/payload-types';
import { isEventClosed } from '@/utils/eventEnded';

/**
 * Event ticket checkout, using Stripe's deferred-intent flow: the checkout form
 * renders from GET (price + how many tickets can be bought, no Stripe call),
 * and the PaymentIntent is only created by POST when the buyer presses Pay or
 * confirms a wallet. So visiting an event page leaves nothing in Stripe.
 *
 * Fulfillment — order creation, ticketsSold, ticket email, newsletter opt-in —
 * happens in the `payment_intent.succeeded` webhook, keyed off the metadata set
 * here. Amount and quantity limits are computed server-side; the client cannot
 * influence the price.
 */

type Purchasable = { event: Event; price: number; maxQuantity: number };

async function loadPurchasable(
  eventId: unknown
): Promise<Purchasable | NextResponse> {
  if (!eventId) {
    return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
  }

  const payload = await getPayload({ config: payloadConfig });
  const event = await payload.findByID({
    collection: 'events',
    id: eventId as number,
    depth: 1,
    disableErrors: true,
  });

  const price = event?.price ?? 0;
  if (!event || !event.priceId || !event.productId || !(price > 0)) {
    return NextResponse.json(
      { error: 'Event is not purchasable' },
      { status: 400 }
    );
  }

  // The event page redirects an hour after the start, but a page loaded
  // before then (or a direct call) could still ask to buy.
  if (isEventClosed(event)) {
    return NextResponse.json(
      { error: 'Ticket sales have closed' },
      { status: 410 }
    );
  }

  const capacity = (event.location as Location | null)?.capacity;
  const remaining = (capacity ?? 0) - (event.ticketsSold ?? 0);
  if (capacity && remaining <= 0) {
    return NextResponse.json({ error: 'Sold out' }, { status: 409 });
  }

  const maxQuantity = Math.max(
    1,
    Math.min(5, capacity != null ? remaining : 5)
  );
  return { event, price, maxQuantity };
}

// What the checkout form needs to render before any PaymentIntent exists.
export async function GET(req: NextRequest) {
  try {
    const eventId = req.nextUrl.searchParams.get('eventId');
    const result = await loadPurchasable(eventId ? Number(eventId) : null);
    if (result instanceof NextResponse) return result;

    return NextResponse.json({
      unitAmount: formatAmountForStripe(result.price, 'usd'),
      maxQuantity: result.maxQuantity,
    });
  } catch (err) {
    await logtail.error(`API /stripe/payment-intent GET failed: ${err}`, {
      method: 'GET',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Failed to load checkout' },
      { status: 500 }
    );
  }
}

/**
 * Creates the PaymentIntent at the moment the buyer pays, or — if this buyer
 * already has one from an earlier attempt that didn't go through (declined
 * card) — updates and reuses it, so a retry doesn't leave a second one behind.
 */
export async function POST(req: NextRequest) {
  try {
    const { eventId, quantity, newsletter, paymentIntentId } = await req.json();

    const result = await loadPurchasable(eventId);
    if (result instanceof NextResponse) return result;
    const { event, price, maxQuantity } = result;

    // Seats may have sold since the form loaded. Refuse rather than clamp: the
    // buyer agreed to the amount on screen, which Stripe also checks against.
    const qty = Math.max(1, Number(quantity) || 1);
    if (qty > maxQuantity) {
      return NextResponse.json(
        {
          error: `Only ${maxQuantity} ticket${maxQuantity > 1 ? 's' : ''} left.`,
          maxQuantity,
        },
        { status: 409 }
      );
    }
    const amount = formatAmountForStripe(price * qty, 'usd');

    const metadata = {
      eventId: String(event.id),
      productId: event.productId!,
      priceId: event.priceId!,
      quantity: String(qty),
      unit_price: String(price),
      newsletter_optin: newsletter ? 'true' : 'false',
    };

    // A raw PaymentIntent has no line items, so the Stripe dashboard would show
    // only an amount. The description is what makes a payment identifiable there
    // (and on the buyer's receipt) without cross-referencing metadata.
    const description = `${event.name} — ${qty} ticket${qty > 1 ? 's' : ''}`;

    if (paymentIntentId) {
      const existing =
        await stripeCheckout.paymentIntents.retrieve(paymentIntentId);
      if (existing.status === 'requires_payment_method') {
        const updated = await stripeCheckout.paymentIntents.update(
          paymentIntentId,
          { amount, description, metadata }
        );
        return NextResponse.json({
          clientSecret: updated.client_secret,
          paymentIntentId: updated.id,
        });
      }
    }

    const intent = await stripeCheckout.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      description,
      metadata,
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    });
  } catch (err) {
    await logtail.error(`API /stripe/payment-intent failed: ${err}`, {
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
