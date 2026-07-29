import { logtail } from '@/lib/logtail';
import { stripe } from '@/lib/stripe';
import payloadConfig from '@/payload.config';
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const eventId = searchParams.get('eventid');

    if (!eventId) {
      await logtail.error(' API /attendees missing eventId', {
        method: 'GET',
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    const payload = await getPayload({ config: payloadConfig });

    const { productId, name: eventName } = await payload.findByID({
      collection: 'events',
      id: eventId,
    });

    if (!productId) {
      await logtail.error(
        `API /attendees productId on event with eventId: ${eventId}`,
        {
          method: 'GET',
          timestamp: new Date().toISOString(),
        }
      );
      return NextResponse.json(
        { error: 'Missing productId on event with eventId: ', eventId },
        { status: 500 }
      );
    }

    const { docs: orders } = await payload.find({
      collection: 'orders',
      where: { productId: { equals: productId } },
    });

    if (orders.length === 0) {
      await logtail.error(
        `API /attendees Could not find orders for product id: ${productId}`,
        {
          method: 'GET',
          timestamp: new Date().toISOString(),
        }
      );
      return NextResponse.json(
        { error: 'Could not find orders for product id: ', productId },
        { status: 500 }
      );
    }

    const attendees: Attendee[] = [];

    // Orders are only created after a successful payment, and each stores the
    // Stripe customer + quantity — so the roster is built directly from the
    // customer, independent of whether the order came from a Checkout Session
    // (legacy) or a PaymentIntent (current).
    for (const { customerId, quantity, createdAt } of orders) {
      if (!customerId) continue;

      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted) continue;

      const customerName = customer.name ?? 'N/A';
      const customerEmail = customer.email;

      let remaining = quantity ?? 1;
      while (remaining > 0 && !!customerEmail) {
        attendees.push({
          eventName,
          customerName,
          customerEmail,
          createdAt,
        });
        remaining--;
      }
    }
    attendees.sort((a, b) => a.customerName.localeCompare(b.customerName));
    return NextResponse.json({
      success: true,
      status: 200,
      attendees,
      eventName,
    });
  } catch (err: any) {
    await logtail.error(`API /attendees Internal server error ${err}`, {
      method: 'GET',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
