import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-08-01',
});

export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    console.error('Stripe webhook failed. Missing Stripe signature');
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 }
    );
  }

  try {
    const rawBody = await req.text();

    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const payload = await getPayload({ config: payloadConfig });
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.payment_status === 'paid') {
          const customerId =
            typeof session.customer === 'string'
              ? session.customer
              : session.customer?.id;
          const amountPaid = session.amount_total;
          const transactionDate = new Date(
            session.created * 1000
          ).toISOString();

          const lineItems = await stripe.checkout.sessions.listLineItems(
            session.id!
          );

          const paymentIntent = session.payment_intent
            ? await stripe.paymentIntents.retrieve(
                session.payment_intent.toString()
              )
            : null;

          const receiptUrl = paymentIntent?.charges?.data?.[0]?.receipt_url;

          if (!customerId || !amountPaid || !receiptUrl) {
            return NextResponse.json(
              {
                error:
                  'Failed to find stripe data. Check stripe for session ID: ' +
                  session.id,
              },
              { status: 404 }
            );
          }

          for (const { product, quantity, price } of lineItems.data) {
            if (!product || !quantity || !price?.unit_amount) {
              console.error('Failed to find stripe product data');
              continue;
            }

            const productId =
              typeof product === 'string' ? product : (product?.id ?? '');

            const eventDocs = await payload.find({
              collection: 'events',
              disableErrors: true,
              limit: 1,
              where: { productId: { equals: productId } },
            });

            const event = eventDocs.docs[0];

            let item;
            if (event?.id) {
              await payload.update({
                collection: 'events',
                id: event.id,
                data: {
                  ticketsSold: (event.ticketsSold ?? 0) + (quantity ?? 0),
                },
              });

              item = {
                relationTo: 'events' as const,
                value: event.id,
              };
            } else {
              const merchDocs = await payload.find({
                collection: 'merch',
                disableErrors: true,
                where: { productId: { equals: productId } },
              });

              const merch = merchDocs.docs[0];

              if (merch?.id) {
                // update merch quantity sold
                item = {
                  relationTo: 'merch' as const,
                  value: merch.id,
                };
              } else {
                // no event or merch found - throw an error
                console.error(
                  'Failed to find event or merch. Check stripe for product ID: ' +
                    productId
                );
                return NextResponse.json(
                  {
                    error:
                      'Failed to find event or merch. Check stripe for product ID: ' +
                      productId,
                  },
                  { status: 404 }
                );
              }
            }

            payload.create({
              collection: 'purchases',
              data: {
                checkoutSessionId: session.id,
                customerId,
                amountPaid,
                transactionDate,
                productId,
                receiptUrl,
                quantity,
                price: price.unit_amount / 100,
                item,
              },
            });
          }
        }

        break;
      }
    }
  } catch (err) {
    console.error('Stripe webhook failed.', err);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
