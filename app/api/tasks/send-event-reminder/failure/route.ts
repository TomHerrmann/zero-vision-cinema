import { NextResponse } from 'next/server';
import { logtail } from '@/lib/logtail';
import { verifyQstashRequest } from '@/lib/qstash';

/**
 * QStash `failureCallback` target for the event-reminder task. Fires once QStash
 * has exhausted all retries and dead-lettered the message. Logs to logtail so a
 * stuck reminder is visible instead of failing silently.
 */
export async function POST(req: Request) {
  let failure: unknown;
  try {
    failure = await verifyQstashRequest(req);
  } catch (err) {
    await logtail.error(
      `API /tasks/send-event-reminder/failure: signature verification failed: ${err}`
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await logtail.error(
    `API /tasks/send-event-reminder: reminder delivery FAILED after all retries (dead-lettered)`,
    { failure, timestamp: new Date().toISOString() }
  );

  return NextResponse.json({ received: true }, { status: 200 });
}
