import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { Resend } from 'resend';
import { logtail } from '@/lib/logtail';
import { verifyQstashRequest } from '@/lib/qstash';
import { getCustomerEmail } from '@/lib/stripe';
import { ZVC_DISPLAY_NAME_EMAIL } from '@/app/contsants/constants';
import RefundDeclinedEmail, {
  REFUND_DECLINED_COPY,
  refundDeclinedEmailReady,
} from '@/emails/RefundDeclinedEmail';
import type { Event } from '@/payload-types';

const resend = new Resend(process.env.RESEND_API_KEY);

type Body = { requestId?: number };

/**
 * QStash-delivered task: tell the buyer their refund request was declined.
 * Skipped while the decline wording is unwritten (see RefundDeclinedEmail).
 * Resolves the address from Stripe at send time (never stored). Idempotent via
 * `declineEmailSentAt`.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await verifyQstashRequest<Body>(req);
  } catch (err) {
    await logtail.error(
      `API /tasks/send-refund-declined-email: signature verification failed: ${err}`
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { requestId } = body;
  if (!requestId) {
    return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
  }
  if (!refundDeclinedEmailReady()) {
    return NextResponse.json({ received: true, skipped: true }, { status: 200 });
  }

  try {
    const payload = await getPayload({ config: payloadConfig });
    const request = await payload.findByID({
      collection: 'refund-requests',
      id: requestId,
      depth: 1,
      disableErrors: true,
    });
    if (!request || request.status !== 'declined' || request.declineEmailSentAt) {
      return NextResponse.json({ received: true, skipped: true }, { status: 200 });
    }
    const order = typeof request.order === 'object' ? request.order : null;
    const eventId =
      order?.item?.relationTo === 'events'
        ? typeof order.item.value === 'object'
          ? order.item.value.id
          : order.item.value
        : null;
    const event_ = eventId
      ? ((await payload.findByID({
          collection: 'events',
          id: eventId,
          depth: 0,
          disableErrors: true,
        })) as Event | null)
      : null;

    const email = await getCustomerEmail(request.customerId);
    if (!email || !order) {
      await logtail.error(
        `API /tasks/send-refund-declined-email: no address or order for request ${requestId}`
      );
      return NextResponse.json({ received: true, skipped: true }, { status: 200 });
    }

    const { error: sendError } = await resend.emails.send({
      from: ZVC_DISPLAY_NAME_EMAIL,
      to: email,
      subject: REFUND_DECLINED_COPY.subject,
      react: (
        <RefundDeclinedEmail eventName={event_?.name ?? ''} orderNumber={order.id} />
      ),
    });
    if (sendError) {
      throw new Error(`Resend error: ${sendError.message ?? JSON.stringify(sendError)}`);
    }

    await payload.update({
      collection: 'refund-requests',
      id: requestId,
      data: { declineEmailSentAt: new Date().toISOString() },
    });
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    await logtail.error(
      `API /tasks/send-refund-declined-email: send failed for request ${requestId}: ${err}`,
      { method: 'POST', timestamp: new Date().toISOString() }
    );
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
