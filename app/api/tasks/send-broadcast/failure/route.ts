import { NextResponse } from 'next/server';
import { logtail } from '@/lib/logtail';
import { verifyQstashRequest } from '@/lib/qstash';

/**
 * QStash `failureCallback` for the broadcast task. Fires once retries are
 * exhausted; logs to logtail so a stuck announcement/reminder is visible.
 */
export async function POST(req: Request) {
  let failure: unknown;
  try {
    failure = await verifyQstashRequest(req);
  } catch (err) {
    await logtail.error(
      `API /tasks/send-broadcast/failure: signature verification failed: ${err}`
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await logtail.error(
    `API /tasks/send-broadcast: broadcast delivery FAILED after all retries (dead-lettered)`,
    { failure, timestamp: new Date().toISOString() }
  );

  return NextResponse.json({ received: true }, { status: 200 });
}
