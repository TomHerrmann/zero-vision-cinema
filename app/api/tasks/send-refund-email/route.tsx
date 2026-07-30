import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { Resend } from 'resend';
import { logtail } from '@/lib/logtail';
import { verifyQstashRequest } from '@/lib/qstash';
import { getCustomerEmail, getReceiptDetails } from '@/lib/stripe';
import { ZVC_EMAIL_ADDRESS } from '@/app/contsants/constants';
import RefundEmail from '@/emails/RefundEmail';
import type { Event } from '@/payload-types';

const resend = new Resend(process.env.RESEND_API_KEY);

type Body = { orderId?: number };

/**
 * QStash-delivered task: send the refund-confirmation email. Enqueued by the
 * Stripe webhook on `charge.refunded`. Resolves the buyer email + card/receipt
 * details from Stripe at send time (never stored). Idempotent via
 * `refundEmailSentAt`.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await verifyQstashRequest<Body>(req);
  } catch (err) {
    await logtail.error(
      `API /tasks/send-refund-email: signature verification failed: ${err}`
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { orderId } = body;
  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
  }

  try {
    const payload = await getPayload({ config: payloadConfig });

    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
      disableErrors: true,
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (order.refundEmailSentAt) {
      return NextResponse.json({ received: true, skipped: true }, { status: 200 });
    }

    const eventDocs = await payload.find({
      collection: 'events',
      disableErrors: true,
      limit: 1,
      depth: 0,
      where: { productId: { equals: order.productId } },
    });
    const event_ = eventDocs.docs[0] as Event | undefined;

    const email = await getCustomerEmail(order.customerId);
    if (!email || !event_?.id) {
      // Can't build/send (no email or no event) — mark done so QStash stops.
      await payload.update({
        collection: 'orders',
        id: orderId,
        data: { refundEmailSentAt: new Date().toISOString() },
      });
      return NextResponse.json({ received: true, skipped: true }, { status: 200 });
    }

    const receipt = order.paymentIntentId
      ? await getReceiptDetails(order.paymentIntentId)
      : {};

    const { error: sendError } = await resend.emails.send({
      from: ZVC_EMAIL_ADDRESS,
      subject: `Your refund for ${event_.name} — Zero Vision Cinema`,
      to: email,
      react: (
        <RefundEmail
          eventName={event_.name}
          eventDate={event_.datetime}
          orderNumber={order.id}
          refundAmount={order.amountPaid}
          currency={receipt.currency}
          cardBrand={receipt.cardBrand}
          cardLast4={receipt.cardLast4}
          refundDate={order.refundedAt ?? new Date().toISOString()}
          receiptUrl={receipt.receiptUrl ?? order.receiptUrl}
        />
      ),
    });
    if (sendError) {
      throw new Error(
        `Resend error: ${sendError.message ?? JSON.stringify(sendError)}`
      );
    }

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: { refundEmailSentAt: new Date().toISOString() },
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    await logtail.error(
      `API /tasks/send-refund-email: send failed for order ${orderId}: ${err}`,
      { method: 'POST', timestamp: new Date().toISOString() }
    );
    return NextResponse.json(
      { error: 'Failed to send refund email' },
      { status: 500 }
    );
  }
}
