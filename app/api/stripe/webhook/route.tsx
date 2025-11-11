import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { headers } from 'next/headers';
import { logtail } from '@/lib/logtail';
import { stripe } from '@/lib/stripe';
import { Resend } from 'resend';
import { ZVC_EMAIL_ADDRESS } from '@/app/contsants/constants';
import TicketEmail from '@/emails/TicketEmail';
import { Location } from '@/payload-types';

const resend = new Resend(process.env.RESEND_API_KEY);

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
      case 'payment_intent.succeeded': {
        const payload = await getPayload({ config: payloadConfig });
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Check if order already exists to prevent duplicates
        const { docs: existingOrders } = await payload.find({
          collection: 'orders',
          where: {
            paymentIntentId: {
              equals: paymentIntent.id,
            },
          },
        });

        if (existingOrders.length > 0) {
          await logtail.info(
            `API /stripe/webhook: Duplicate payment intent ${paymentIntent.id} received. Ignoring.`
          );
          return NextResponse.json({ received: true }, { status: 200 });
        }

        const eventId = paymentIntent.metadata.eventId;
        const quantity = parseInt(paymentIntent.metadata.quantity || '1', 10);

        if (!eventId) {
          await logtail.error(
            `API /stripe/webhook: Missing eventId in payment intent metadata. Payment Intent ID: ${paymentIntent.id}`
          );
          return NextResponse.json(
            { error: 'Missing eventId in metadata' },
            { status: 400 }
          );
        }

        // Get customer details
        let customerId = paymentIntent.customer
          ? typeof paymentIntent.customer === 'string'
            ? paymentIntent.customer
            : paymentIntent.customer.id
          : null;

        // Get customer email from charge or customer object
        let customerEmail: string | null = null;
        let customerName: string | null = null;

        if (paymentIntent.charges?.data?.[0]) {
          const charge = paymentIntent.charges.data[0];
          customerEmail = charge.billing_details.email;
          customerName = charge.billing_details.name;
        }

        if (!customerId && (customerEmail || customerName)) {
          const newCustomer = await stripe.customers.create({
            email: customerEmail ?? undefined,
            name: customerName ?? undefined,
          });
          customerId = newCustomer.id;
        }

        // Get event details
        const eventDoc = await payload.findByID({
          collection: 'events',
          id: eventId,
        });

        if (!eventDoc) {
          await logtail.error(
            `API /stripe/webhook: Event not found. Event ID: ${eventId}`
          );
          return NextResponse.json(
            { error: 'Event not found' },
            { status: 404 }
          );
        }

        // Update event ticket count
        await payload.update({
          collection: 'events',
          id: eventId,
          data: {
            ticketsSold: (eventDoc.ticketsSold ?? 0) + quantity,
          },
        });

        // Get receipt URL
        const receiptUrl = paymentIntent.charges?.data?.[0]?.receipt_url;

        // Create order
        const newOrder = await payload.create({
          collection: 'orders',
          data: {
            paymentIntentId: paymentIntent.id,
            customerId: customerId ?? '',
            amountPaid: paymentIntent.amount / 100,
            transactionDate: new Date(
              paymentIntent.created * 1000
            ).toISOString(),
            productId: eventDoc.productId || '',
            receiptUrl: receiptUrl ?? '',
            quantity,
            price: paymentIntent.amount / 100 / quantity,
            item: {
              relationTo: 'events' as const,
              value: Number(eventId),
            },
          },
        });

        // Send ticket email
        if (newOrder.id && customerEmail) {
          try {
            const eventImage =
              typeof eventDoc.image === 'object'
                ? eventDoc.image
                : await payload.findByID({
                    collection: 'media',
                    id: eventDoc.image,
                  });

            if (eventImage.filename) {
              await resend.emails.send({
                from: ZVC_EMAIL_ADDRESS,
                subject: `Your ZVC Ticket: ${eventDoc.name}`,
                to: customerEmail,
                react: (
                  <TicketEmail
                    eventName={eventDoc.name}
                    eventImage={`${process.env.VERCEL_BLOB_URL}${eventImage.filename}`}
                    eventDate={eventDoc.datetime}
                    eventLocation={(eventDoc.location as Location).name}
                    quantity={quantity}
                    eventDescription={eventDoc.description}
                    eventAddress={(eventDoc.location as Location).address}
                    totalAmount={paymentIntent.amount / 100}
                    purchaseDate={new Date(
                      paymentIntent.created * 1000
                    ).toISOString()}
                  />
                ),
              });
            }
          } catch (emailError) {
            await logtail.error(
              `API /stripe/webhook: Failed to send ticket email for order ${newOrder.id}: ${emailError}`,
              {
                method: 'POST',
                timestamp: new Date().toISOString(),
              }
            );
          }
        }

        break;
      }

      case 'checkout.session.completed': {
        const payload = await getPayload({ config: payloadConfig });
        const session = event.data.object as Stripe.Checkout.Session;

        const { docs: existingOrders } = await payload.find({
          collection: 'orders',
          where: {
            checkoutSessionId: {
              equals: session.id,
            },
          },
        });

        if (existingOrders.length > 0) {
          await logtail.info(
            `API /stripe/webhook: Duplicate checkout session ${session.id} received. Ignoring.`
          );
          return NextResponse.json({ received: true }, { status: 200 });
        }

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
            await logtail.error(
              `API /stripe/webhook: Failed to find Stripe data. Session ID: ${session.id}`
            );
            return NextResponse.json(
              {
                error:
                  'Failed to find stripe data. Check stripe for session ID: ' +
                  session.id,
              },
              { status: 400 }
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
                  { status: 400 }
                );
              }
            }

            const newOrder = await payload.create({
              collection: 'orders',
              data: {
                checkoutSessionId: session.id,
                customerId: customerId ?? '',
                amountPaid: amountPaid / 100,
                transactionDate,
                productId,
                receiptUrl,
                quantity,
                price: price.unit_amount / 100,
                item,
              },
            });

            if (newOrder.id) {
              let email = null;
              if (session.customer_details?.email) {
                email = session.customer_details.email;
              } else if (customerId) {
                const customer = await stripe.customers.retrieve(customerId);
                if (customer && 'email' in customer) {
                  if (customer.email) {
                    email = customer.email;
                  }
                }
              }

              const eventImage =
                typeof event.image === 'object'
                  ? event.image
                  : await payload.findByID({
                      collection: 'media',
                      id: event.image,
                    });

              if (!email || !eventImage.filename) {
                return;
              }

              try {
                await resend.emails.send({
                  from: ZVC_EMAIL_ADDRESS,
                  subject: `Your ZVC Ticket: ${event.name}`,
                  to: email,
                  react: (
                    <TicketEmail
                      eventName={event.name}
                      eventImage={`${process.env.VERCEL_BLOB_URL}${eventImage.filename}`}
                      eventDate={event.datetime}
                      eventLocation={(event.location as Location).name}
                      quantity={quantity}
                      eventDescription={event.description}
                      eventAddress={(event.location as Location).address}
                      totalAmount={amountPaid / 100}
                      purchaseDate={transactionDate}
                    />
                  ),
                });
              } catch (emailError) {
                await logtail.error(
                  `API /stripe/webhook: Failed to send ticket email for order ${newOrder.id}: ${emailError}`,
                  {
                    method: 'POST',
                    timestamp: new Date().toISOString(),
                  }
                );
              }
            }
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
