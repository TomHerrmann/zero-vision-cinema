import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { stripeCheckout } from '@/lib/stripe';
import { logtail } from '@/lib/logtail';

/**
 * Creates an embedded Stripe Checkout Session for an event and returns its
 * client secret. The `checkout.session.completed` webhook handles order
 * creation, ticketsSold, the ticket email, and (via metadata) the newsletter
 * opt-in — so nothing else needs to change downstream.
 */
export async function POST(req: NextRequest) {
  try {
    const { eventId, newsletter } = await req.json();

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    const payload = await getPayload({ config: payloadConfig });
    const event = await payload.findByID({
      collection: 'events',
      id: eventId,
      depth: 0,
    });

    if (!event || !event.priceId || !(event.price > 0)) {
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

    const session = await stripeCheckout.checkout.sessions.create({
      ui_mode: 'embedded',
      mode: 'payment',
      customer_creation: 'always',
      redirect_on_completion: 'never',
      line_items: [
        {
          price: event.priceId,
          quantity: 1,
          adjustable_quantity: { enabled: true, minimum: 1, maximum: maxQuantity },
        },
      ],
      metadata: {
        eventId: String(event.id),
        newsletter_optin: newsletter ? 'true' : 'false',
      },
    });

    return NextResponse.json({ clientSecret: session.client_secret });
  } catch (err) {
    await logtail.error(`API /stripe/checkout-session failed: ${err}`, {
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
