import { NextResponse } from 'next/server';
import { logtail } from '@/lib/logtail';
import { verifyQstashRequest } from '@/lib/qstash';

/**
 * QStash `failureCallback` target for the ticket-email task. Invoked once QStash
 * has exhausted all retries and dead-lettered the message. Logs to logtail (the
 * monitored sink) so a stuck ticket email pages us instead of failing silently.
 *
 * Future: also POST to the ZVC Discord webhook for an immediate alert.
 */
export async function POST(req: Request) {
  let failure: unknown;
  try {
    failure = await verifyQstashRequest(req);
  } catch (err) {
    await logtail.error(
      `API /tasks/send-ticket-email/failure: signature verification failed: ${err}`
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await logtail.error(
    `API /tasks/send-ticket-email: ticket email delivery FAILED after all retries (dead-lettered)`,
    { failure, timestamp: new Date().toISOString() }
  );

  // Ack so QStash doesn't retry the callback itself.
  return NextResponse.json({ received: true }, { status: 200 });
}
