import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { stripeCheckout } from '@/lib/stripe';
import { logtail } from '@/lib/logtail';
import { formatAmountForStripe } from '@/utils/stripeUtils';

/**
 * Creates (or updates) a PaymentIntent for an event ticket purchase and returns
 * its client secret for Stripe Elements (Express Checkout + Payment Element).
 * Fulfillment — order creation, ticketsSold, ticket email, newsletter opt-in —
 * happens in the `payment_intent.succeeded` webhook, keyed off the metadata set
 * here. Amount and quantity limits are computed server-side; the client cannot
 * influence the price.
 */
export async function POST(req: NextRequest) {
  try {
    const { eventId, quantity, newsletter, paymentIntentId } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    const payload = await getPayload({ config: payloadConfig });
    const event = await payload.findByID({
      collection: 'events',
      id: eventId,
      depth: 0,
    });

    if (
      !event ||
      !event.priceId ||
      !event.productId ||
      !(event.price > 0)
    ) {
      return NextResponse.json(
        { error: 'Event is not purchasable' },
        { status: 400 }
      );
    }

    const remaining = (event.ticketLimit ?? 0) - (event.ticketsSold ?? 0);
    if (event.ticketLimit != null && remaining <= 0) {
      return NextResponse.json({ error: 'Sold out' }, { status: 409 });
    }

    const maxQuantity = Math.max(
      1,
      Math.min(5, event.ticketLimit != null ? remaining : 5)
    );
    const qty = Math.max(1, Math.min(maxQuantity, Number(quantity) || 1));
    const amount = formatAmountForStripe(event.price * qty, 'usd');

    const metadata = {
      eventId: String(event.id),
      productId: event.productId,
      priceId: event.priceId,
      quantity: String(qty),
      unit_price: String(event.price),
      newsletter_optin: newsletter ? 'true' : 'false',
    };

    // Update an in-progress PaymentIntent (quantity/newsletter changed) rather
    // than creating a new one, so the client secret — and any entered card /
    // open wallet sheet — stays valid.
    if (paymentIntentId) {
      const existing =
        await stripeCheckout.paymentIntents.retrieve(paymentIntentId);
      if (existing.status === 'requires_payment_method') {
        const updated = await stripeCheckout.paymentIntents.update(
          paymentIntentId,
          { amount, metadata }
        );
        return NextResponse.json({
          clientSecret: updated.client_secret,
          paymentIntentId: updated.id,
          amount,
          maxQuantity,
        });
      }
    }

    const intent = await stripeCheckout.paymentIntents.create({
      amount,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata,
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount,
      maxQuantity,
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
