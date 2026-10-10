import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { verifyRefundToken } from '@/lib/refundToken';
import { createRefundRequest } from '@/lib/refundRequests';
import { logtail } from '@/lib/logtail';

/**
 * Buyer's refund request. Requires the signed token from their ticket email.
 * Nothing is refunded here: it files a refund request and emails us, and an
 * admin approves or declines it (see lib/refundRequests). Asking again while
 * one is pending returns the same request.
 */
export async function POST(req: NextRequest) {
  try {
    const { order: orderId, token } = await req.json();
    const id = Number(orderId);

    if (!id || !token || !verifyRefundToken(id, token)) {
      return NextResponse.json({ error: 'Invalid refund link' }, { status: 403 });
    }

    const payload = await getPayload({ config: payloadConfig });
    const result = await createRefundRequest(payload, id, 'buyer');
    if (!result.ok) {
      const error =
        result.status === 400
          ? 'This order cannot be refunded online. Please email us.'
          : result.error;
      return NextResponse.json({ error }, { status: result.status });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    await logtail.error(`API /refund failed: ${err}`, {
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Something went wrong. Please email us.' },
      { status: 500 }
    );
  }
}
