// app/api/attendees/route.ts

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
    const eventId = searchParams.get('eventId');

    if (!eventId) {
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

    const attendees: Attendee[] = [];

    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
    });

    for (const session of sessions.data) {
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

        attendees.push({
          eventName,
          customerName,
          customerEmail,
          quantity: item.quantity ?? 1,
        });
      }
    }

    return NextResponse.json({ attendees });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
