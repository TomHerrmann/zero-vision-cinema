import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { Resend } from 'resend';
import { logtail } from '@/lib/logtail';
import { verifyQstashRequest } from '@/lib/qstash';
import { getRefundRequestSummary } from '@/lib/refundRequests';
import {
  ZVC_DISPLAY_NAME_EMAIL,
  ZVC_EMAIL_ADDRESS,
  ZVC_SITE_URL,
} from '@/app/contsants/constants';
import RefundRequestEmail from '@/emails/RefundRequestEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

type Body = { requestId?: number };

/**
 * QStash-delivered task: email us that a buyer asked for a refund, with a link
 * to approve or decline it in the admin. Idempotent via `notifiedAt`.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await verifyQstashRequest<Body>(req);
  } catch (err) {
    await logtail.error(
      `API /tasks/send-refund-request-email: signature verification failed: ${err}`
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { requestId } = body;
  if (!requestId) {
    return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
  }

  try {
    const payload = await getPayload({ config: payloadConfig });
    const request = await payload.findByID({
      collection: 'refund-requests',
      id: requestId,
      depth: 0,
      disableErrors: true,
    });
    if (!request) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }
    if (request.notifiedAt) {
      return NextResponse.json({ received: true, skipped: true }, { status: 200 });
    }

    const summary = await getRefundRequestSummary(payload, requestId);
    if (!summary) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { error: sendError } = await resend.emails.send({
      from: ZVC_DISPLAY_NAME_EMAIL,
      to: ZVC_EMAIL_ADDRESS,
      subject: `Refund request: order ${summary.orderId}${summary.eventName ? `, ${summary.eventName}` : ''}`,
      react: (
        <RefundRequestEmail
          summary={summary}
          reviewUrl={`${ZVC_SITE_URL}/admin/collections/refund-requests/${requestId}`}
        />
      ),
    });
    if (sendError) {
      throw new Error(`Resend error: ${sendError.message ?? JSON.stringify(sendError)}`);
    }

    await payload.update({
      collection: 'refund-requests',
      id: requestId,
      data: { notifiedAt: new Date().toISOString() },
    });
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    await logtail.error(
      `API /tasks/send-refund-request-email: send failed for request ${requestId}: ${err}`,
      { method: 'POST', timestamp: new Date().toISOString() }
    );
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
