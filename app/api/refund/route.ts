import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { stripeCheckout } from '@/lib/stripe';
import { verifyRefundToken } from '@/lib/refundToken';
import { logtail } from '@/lib/logtail';
import type { Event } from '@/payload-types';

const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;

/**
 * Self-service refund. Requires the signed token from the buyer's ticket email.
 * Auto-issues a Stripe refund only when the event is >48h away; within 48h the
 * buyer is told to email support. The `charge.refunded` webhook then marks the
 * order refunded, frees the seat, cancels reminders, and sends the refund email.
 */
export async function POST(req: NextRequest) {
  try {
    const { order: orderId, token } = await req.json();
    const id = Number(orderId);

    if (!id || !token || !verifyRefundToken(id, token)) {
      return NextResponse.json({ error: 'Invalid refund link' }, { status: 403 });
    }

    const payload = await getPayload({ config: payloadConfig });
    const order = await payload.findByID({
      collection: 'orders',
      id,
      depth: 0,
      disableErrors: true,
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.refundedAt) {
      return NextResponse.json(
        { error: 'This order has already been refunded.' },
        { status: 409 }
      );
    }
    if (!order.paymentIntentId) {
      return NextResponse.json(
        { error: 'This order cannot be refunded online. Please email us.' },
        { status: 400 }
      );
    }

    // Enforce the 48h window against the event start.
    const eventDocs = await payload.find({
      collection: 'events',
      disableErrors: true,
      limit: 1,
      where: { productId: { equals: order.productId } },
    });
    const event_ = eventDocs.docs[0] as Event | undefined;
    if (!event_?.id) {
      return NextResponse.json(
        { error: 'Event not found for this order.' },
        { status: 404 }
      );
    }
    const msUntilEvent = new Date(event_.datetime).getTime() - Date.now();
    if (msUntilEvent < FORTY_EIGHT_HOURS) {
      return NextResponse.json(
        {
          error:
            'This event is within 48 hours. Email us to request a refund.',
          withinWindow: true,
        },
        { status: 422 }
      );
    }

    // Issue the refund. Fulfillment (mark refunded, free seat, email, cancel
    // reminders) happens in the charge.refunded webhook.
    await stripeCheckout.refunds.create({
      payment_intent: order.paymentIntentId,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    await logtail.error(`API /refund failed: ${err}`, {
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Refund failed. Please email us.' },
      { status: 500 }
    );
  }
}
