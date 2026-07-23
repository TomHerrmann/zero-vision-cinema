import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { headers } from 'next/headers';
import { logtail } from '@/lib/logtail';
import { stripe, stripeCheckout } from '@/lib/stripe';
import { Resend } from 'resend';
import { ZVC_EMAIL_ADDRESS } from '@/app/contsants/constants';
import TicketEmail from '@/emails/TicketEmail';
import { Location } from '@/payload-types';
import { subscribeEmail } from '@/lib/mailerlite';
import { fetchMovieDataByImdbId } from '@/lib/omdb';

const resend = new Resend(process.env.RESEND_API_KEY);

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
        const pi = event.data.object as Stripe.PaymentIntent;

        // Idempotency — this event can be delivered more than once.
        const { docs: existingOrders } = await payload.find({
          collection: 'orders',
          where: { paymentIntentId: { equals: pi.id } },
        });
        if (existingOrders.length > 0) {
          await logtail.info(
            `API /stripe/webhook: Duplicate payment_intent ${pi.id} received. Ignoring.`
          );
          return NextResponse.json({ received: true }, { status: 200 });
        }

        const productId = pi.metadata?.productId;
        const quantity = Number(pi.metadata?.quantity ?? '1');
        const unitPrice = Number(pi.metadata?.unit_price ?? '0');
        const newsletterOptin = pi.metadata?.newsletter_optin === 'true';

        if (!productId) {
          await logtail.error(
            `API /stripe/webhook: payment_intent ${pi.id} missing productId metadata`
          );
          return NextResponse.json(
            { error: 'Missing product metadata' },
            { status: 400 }
          );
        }

        // Expand the latest charge for the receipt URL and billing details.
        const full = await stripeCheckout.paymentIntents.retrieve(pi.id, {
          expand: ['latest_charge'],
        });
        const charge = (full.latest_charge as Stripe.Charge) ?? null;
        const receiptUrl = charge?.receipt_url ?? null;
        const email =
          charge?.billing_details?.email ?? full.receipt_email ?? null;
        const name = charge?.billing_details?.name ?? undefined;

        if (!receiptUrl) {
          await logtail.error(
            `API /stripe/webhook: No receipt for payment_intent ${pi.id}`
          );
          return NextResponse.json(
            { error: 'Missing receipt for payment intent: ' + pi.id },
            { status: 400 }
          );
        }

        // Resolve (or create) the Stripe customer.
        let customerId: string | null =
          typeof full.customer === 'string'
            ? full.customer
            : (full.customer?.id ?? null);
        if (!customerId && (email || name)) {
          const newCustomer = await stripeCheckout.customers.create({
            email: email ?? undefined,
            name,
          });
          customerId = newCustomer.id;
        }

        // Newsletter opt-in captured on our ticket page (PaymentIntent metadata).
        if (newsletterOptin && email) {
          try {
            await subscribeEmail(email);
          } catch (subErr) {
            await logtail.error(
              `API /stripe/webhook: newsletter opt-in failed for ${email}: ${subErr}`
            );
          }
        }

        const amountPaid = full.amount_received; // cents
        const transactionDate = new Date(full.created * 1000).toISOString();

        // Find the event (or merch) this product maps to and bump its sold count.
        const eventDocs = await payload.find({
          collection: 'events',
          disableErrors: true,
          limit: 1,
          where: { productId: { equals: productId } },
        });
        const event_ = eventDocs.docs[0];

        let item;
        if (event_?.id) {
          await payload.update({
            collection: 'events',
            id: event_.id,
            data: { ticketsSold: (event_.ticketsSold ?? 0) + quantity },
          });
          item = { relationTo: 'events' as const, value: event_.id };
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
              data: { merchSold: (merch.merchSold ?? 0) + quantity },
            });
            item = { relationTo: 'merch' as const, value: merch.id };
          } else {
            await logtail.error(
              `API /stripe/webhook failed to find event or merch. Check stripe for product ID: ${productId}`,
              { method: 'POST', timestamp: new Date().toISOString() }
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
            paymentIntentId: pi.id,
            customerId: customerId ?? '',
            amountPaid: amountPaid / 100,
            transactionDate,
            productId,
            receiptUrl,
            quantity,
            price: unitPrice,
            item,
          },
        });

        // Ticket email — events only.
        if (newOrder.id && event_?.id && email) {
          // image/description are optional on events now — guard both.
          const eventImage = !event_.image
            ? null
            : typeof event_.image === 'object'
              ? event_.image
              : await payload.findByID({
                  collection: 'media',
                  id: event_.image,
                });

          // Poster: uploaded blob image if present, else the OMDB poster URL.
          let posterUrl = eventImage?.filename
            ? `${process.env.VERCEL_BLOB_URL}${eventImage.filename}`
            : undefined;
          if (!posterUrl && event_.imdbId) {
            const movie = await fetchMovieDataByImdbId(event_.imdbId);
            posterUrl = movie?.poster || undefined;
          }

          try {
            await resend.emails.send({
              from: ZVC_EMAIL_ADDRESS,
              subject: `Your ZVC Ticket: ${event_.name}`,
              to: email,
              react: (
                <TicketEmail
                  eventName={event_.name}
                  eventImage={posterUrl}
                  eventDate={event_.datetime}
                  eventLocation={(event_.location as Location).name}
                  quantity={quantity}
                  eventDescription={event_.description ?? undefined}
                  eventAddress={(event_.location as Location).address}
                  totalAmount={amountPaid / 100}
                  purchaseDate={transactionDate}
                />
              ),
            });
          } catch (emailError) {
            await logtail.error(
              `API /stripe/webhook: Failed to send ticket email for order ${newOrder.id}: ${emailError}`,
              { method: 'POST', timestamp: new Date().toISOString() }
            );
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
