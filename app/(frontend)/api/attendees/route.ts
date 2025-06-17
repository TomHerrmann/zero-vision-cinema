import payloadConfig from '@/payload.config';
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-08-01',
});

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('payload-token');

    if (!token) {
      console.error('Unauthorized');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const eventId = searchParams.get('eventId');
    console.log({ eventId });

    if (!eventId) {
      console.error('Missing eventId');
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    const payload = await getPayload({ config: payloadConfig });

    const { productId, name: eventName } = await payload.findByID({
      collection: 'events',
      id: eventId,
    });

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 500 });
    }

    const { docs: purchases } = await payload.find({
      collection: 'purchases',
      where: { productId: { equals: productId } },
    });

    if (purchases.length === 0) {
      return NextResponse.json(
        { error: 'Could not find purchases' },
        { status: 500 }
      );
    }

    const attendees: Attendee[] = [];

    const sessionIds = purchases.map(
      ({ checkoutSessionId }) => checkoutSessionId
    );

    for (const sessionId of sessionIds) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);

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
        console.log('product?.id !== productId -> ', product?.id !== productId);
        if (product?.id !== productId) continue;

        const customerName = session.customer_details?.name ?? null;
        const customerEmail = session.customer_details?.email ?? null;

        let quantity = item.quantity ?? 1;
        while (quantity > 0 && !!customerEmail && !!customerName) {
          attendees.push({
            eventName,
            customerName,
            customerEmail,
            quantity: 1,
          });
          quantity--;
        }
      }
    }
    attendees.sort((a, b) => a.customerName.localeCompare(b.customerName));
    return NextResponse.json({ attendees, eventName });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
