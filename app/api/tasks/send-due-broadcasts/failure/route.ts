import { NextResponse } from 'next/server';
import { logtail } from '@/lib/logtail';
import { verifyQstashRequest } from '@/lib/qstash';

/**
 * QStash `failureCallback` for the daily broadcast dispatcher. Fires once
 * retries are exhausted; a dead-lettered run means nobody got that morning's
 * announcements or reminders at all, so this is the loudest failure in the
 * broadcast path.
 */
export async function POST(req: Request) {
  let failure: unknown;
  try {
    failure = await verifyQstashRequest(req);
  } catch (err) {
    await logtail.error(
      `API /tasks/send-due-broadcasts/failure: signature verification failed: ${err}`
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await logtail.error(
    `API /tasks/send-due-broadcasts: daily dispatch FAILED after all retries (dead-lettered) — no broadcasts went out this run`,
    { failure, timestamp: new Date().toISOString() }
  );

  return NextResponse.json({ received: true }, { status: 200 });
}
