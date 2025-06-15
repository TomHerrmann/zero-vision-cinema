import { getPayload } from 'payload';
import Stripe from 'stripe';
import payloadConfig from '@/payload.config';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_LIVE_SECRET_KEY!, {
  apiVersion: '2022-08-01',
});

type RelatedItem =
  | { relationTo: 'events'; value: number }
  | { relationTo: 'merch'; value: number };

// moved to root dir to make inaccessible
// to run script, place in api dir or refactor

export async function GET(req: NextRequest, res: NextResponse) {
  try {
    const payload = await getPayload({ config: payloadConfig });

    let hasMore = true;
    let startingAfter: string | undefined = undefined;
    let createdCount = 0;
    let skippedCount = 0;

    while (hasMore) {
      const sessionList: Stripe.ApiList<Stripe.Checkout.Session> =
        await stripe.checkout.sessions.list({
          limit: 100,
          ...(startingAfter && { starting_after: startingAfter }),
          expand: ['data.customer'],
        });

      for (const session of sessionList.data) {
        if (
          session.status !== 'complete' ||
          session.payment_status !== 'paid' ||
          !session.id
        ) {
          console.log('Missing session data');
          console.log('session.status: ', session.status);
          console.log('session.payment_status: ', session.payment_status);
          console.log('session.id: ', session.id);
          skippedCount++;
          continue;
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(
          session.payment_intent!.toString()
        );

        const receiptUrl = paymentIntent.charges?.data?.[0]?.receipt_url;

        if (!receiptUrl) {
          console.log('Missing paymentIntent data');
          console.log('receiptUrl: ', receiptUrl);
          skippedCount++;
          continue;
        }

        const transactionDate = new Date(session.created * 1000).toISOString();

        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id,
          { limit: 100 }
        );

        for (const item of lineItems.data) {
          const price = item.price;
          if (
            !price?.unit_amount ||
            !price.product ||
            item.amount_total == null ||
            item.quantity == null
          ) {
            skippedCount++;
            console.log('missing line item data');
            console.log('price.unit_amount: ', price?.unit_amount);
            console.log('price.product: ', price?.product);
            console.log('item.amount_total: ', item.amount_total);
            console.log('item.quantity: ', item.quantity);
            continue;
          }

          const productId = price.product as string;
          let relatedItem: RelatedItem | null = null;
          console.log({ productId });
          const eventResult = await payload.find({
            collection: 'events',
            where: { productId: { equals: productId } },
          });

          if (eventResult.docs.length > 0) {
            relatedItem = {
              relationTo: 'events',
              value: eventResult.docs[0].id,
            };
          } else {
            const merchResult = await payload.find({
              collection: 'merch',
              where: { productId: { equals: productId } },
            });

            if (merchResult.docs.length > 0) {
              relatedItem = {
                relationTo: 'merch',
                value: merchResult.docs[0].id,
              };
            }
          }

          if (!relatedItem) {
            console.log('no relatedItem');
            skippedCount++;
            continue;
          }

          await payload.create({
            collection: 'purchases',
            data: {
              checkoutSessionId: session.id,
              productId,
              price: price.unit_amount / 100,
              amountPaid: item.amount_total / 100,
              quantity: item.quantity,
              transactionDate,
              receiptUrl,
              item: relatedItem,
            },
          });

          createdCount++;
        }
      }

      if (sessionList.has_more) {
        startingAfter = sessionList.data[sessionList.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }

    return NextResponse.json(
      { success: true, createdCount, skippedCount },
      { status: 201 }
    );
  } catch (err) {
    console.error('The backfill failed: ', err);
    return NextResponse.json(
      { error: 'The backfill failed: ' + err },
      { status: 400 }
    );
  }
}
