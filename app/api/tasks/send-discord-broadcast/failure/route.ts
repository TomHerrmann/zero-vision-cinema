import { NextResponse } from 'next/server';
import { logtail } from '@/lib/logtail';
import { verifyQstashRequest } from '@/lib/qstash';

/**
 * QStash `failureCallback` for the Discord broadcast task. Fires once retries
 * are exhausted; logs to logtail so a stuck announcement/reminder is visible.
 * The email for the same event is a separate message and is unaffected.
 */
export async function POST(req: Request) {
  let failure: unknown;
  try {
    failure = await verifyQstashRequest(req);
  } catch (err) {
    await logtail.error(
      `API /tasks/send-discord-broadcast/failure: signature verification failed: ${err}`
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await logtail.error(
    `API /tasks/send-discord-broadcast: Discord post FAILED after all retries (dead-lettered)`,
    { failure, timestamp: new Date().toISOString() }
  );

  return NextResponse.json({ received: true }, { status: 200 });
}
