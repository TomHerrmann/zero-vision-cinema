import { NextResponse } from 'next/server';
import { logtail } from '@/lib/logtail';
import { verifyQstashRequest } from '@/lib/qstash';
import { summarizeQstashFailure } from '@/lib/qstashFailure';

/**
 * QStash `failureCallback` for the weekly email task. Fires once retries are
 * exhausted; logs to logtail so a missed Sunday email is visible.
 */
export async function POST(req: Request) {
  let failure: unknown;
  try {
    failure = await verifyQstashRequest(req);
  } catch (err) {
    await logtail.error(
      `API /tasks/send-weekly-broadcast/failure: signature verification failed: ${err}`
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await logtail.error(
    `API /tasks/send-weekly-broadcast: weekly email FAILED after all retries (dead-lettered)`,
    { failure: summarizeQstashFailure(failure), timestamp: new Date().toISOString() }
  );

  return NextResponse.json({ received: true }, { status: 200 });
}
