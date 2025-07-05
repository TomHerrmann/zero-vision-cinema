import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { headers } from 'next/headers';
import { logtail } from '@/lib/logtail';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-08-01',
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  try {
    const sig = (await headers()).get('stripe-signature');

    if (!sig) {
      await logtail.error(`API /stripe/webhook Missing Stripe signature`, {
        method: 'POST',
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

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

        let customerId: string | null = null;
        if (!session.customer) {
          const customerName = session.customer_details?.name ?? undefined;
          const customerEmail = session.customer_details?.email ?? undefined;

          if (customerName || customerEmail) {
            const newCustomer = await stripe.customers.create({
              name: session.customer_details?.name ?? undefined,
              email: session.customer_details?.email ?? undefined,
            });

            customerId = newCustomer.id;
          }
        } else {
          customerId =
            typeof session.customer === 'string'
              ? session.customer
              : session.customer.id;
        }

        if (session.payment_status === 'paid') {
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

          if (!amountPaid || !receiptUrl) {
            return NextResponse.json(
              {
                error:
                  'Failed to find stripe data. Check stripe for session ID: ' +
                  session.id,
              },
              { status: 404 }
            );
          }

          for (const { quantity, price } of lineItems.data) {
            if (!quantity || !price?.unit_amount || !price.product) {
              await logtail.error(
                `API /stripe/webhook Failed to find stripe product data`,
                {
                  method: 'POST',
                  timestamp: new Date().toISOString(),
                }
              );
              continue;
            }

            const productId =
              typeof price.product === 'string'
                ? price.product
                : (price.product?.id ?? null);

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
                await payload.update({
                  collection: 'merch',
                  id: merch.id,
                  data: {
                    merchSold: (merch.merchSold ?? 0) + (quantity ?? 0),
                  },
                });
                item = {
                  relationTo: 'merch' as const,
                  value: merch.id,
                };
              } else {
                await logtail.error(
                  `API /stripe/webhook failed to find event or merch. Check stripe for product ID: ${productId}`,
                  {
                    method: 'POST',
                    timestamp: new Date().toISOString(),
                  }
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

            await payload.create({
              collection: 'orders',
              data: {
                checkoutSessionId: session.id,
                customerId: customerId ?? '',
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
    await logtail.error(`API /stripe/webhook failed: ${err}`, {
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Stripe webhook failed.', err },
      { status: 400 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
