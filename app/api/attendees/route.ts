import { logtail } from '@/lib/logtail';
import payloadConfig from '@/payload.config';
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-08-01',
});

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

    for (const { checkoutSessionId, createdAt } of orders) {
      const session =
        await stripe.checkout.sessions.retrieve(checkoutSessionId);

      if (session.payment_status !== 'paid') {
        continue;
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
        {
          limit: 100,
          expand: ['data.price.product'],
        }
      );

      for (const item of lineItems.data) {
        const price = item.price;
        const product =
          typeof price?.product === 'string' ? null : price?.product;

        if (product?.id !== productId) continue;

        const customerName = session.customer_details?.name ?? null;
        const customerEmail = session.customer_details?.email ?? null;

        let quantity = item.quantity ?? 1;
        while (quantity > 0 && !!customerEmail) {
          attendees.push({
            eventName,
            customerName: customerName ?? 'N/A',
            customerEmail,
            createdAt,
          });
          quantity--;
        }
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
