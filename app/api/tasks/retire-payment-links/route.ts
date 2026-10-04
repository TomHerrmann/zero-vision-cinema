import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { logtail } from '@/lib/logtail';
import { verifyQstashRequest } from '@/lib/qstash';
import { retireClosedPaymentLinks } from '@/lib/retirePaymentLinks';

/**
 * QStash task: switch off the Stripe payment links of events whose sales
 * have closed. The daily dispatcher (`send-due-broadcasts`) schedules one of
 * these for the moment each of today's events closes. The sweep covers every
 * closed event, so
 * the message carries no body and a late or repeated delivery is harmless.
 */
export async function POST(req: Request) {
  try {
    await verifyQstashRequest(req);
  } catch (err) {
    await logtail.error(
      `API /tasks/retire-payment-links: signature verification failed: ${err}`
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const payload = await getPayload({ config: payloadConfig });
    const retired = await retireClosedPaymentLinks(payload);
    return NextResponse.json({ received: true, retired }, { status: 200 });
  } catch (err) {
    await logtail.error(`API /tasks/retire-payment-links: ${err}`, {
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
    // 500 so QStash retries.
    return NextResponse.json({ error: 'Retire failed' }, { status: 500 });
  }
}
