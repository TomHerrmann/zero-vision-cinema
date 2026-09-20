import { NextResponse } from 'next/server';
import { logtail } from '@/lib/logtail';
import { verifyQstashRequest } from '@/lib/qstash';

/**
 * QStash `failureCallback` for the reward-email task. Fires once retries are
 * exhausted; logs to logtail so a stuck reward email — a buyer who never got
 * their free-ticket code — is visible.
 */
export async function POST(req: Request) {
  let failure: unknown;
  try {
    failure = await verifyQstashRequest(req);
  } catch (err) {
    await logtail.error(
      `API /tasks/send-reward-email/failure: signature verification failed: ${err}`
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await logtail.error(
    `API /tasks/send-reward-email: reward email delivery FAILED after all retries (dead-lettered)`,
    { failure, timestamp: new Date().toISOString() }
  );

  return NextResponse.json({ received: true }, { status: 200 });
}
