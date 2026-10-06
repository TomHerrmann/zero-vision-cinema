import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import payloadConfig from '@payload-config';
import { Resend } from 'resend';
import { logtail } from '@/lib/logtail';
import { verifyQstashRequest } from '@/lib/qstash';
import { getCustomerEmail } from '@/lib/stripe';
import { ZVC_EMAIL_ADDRESS } from '@/app/contsants/constants';
import RewardEmail from '@/emails/RewardEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

type Body = { rewardId?: number };

/**
 * QStash-delivered task: email a newly earned free-ticket code. Enqueued by the
 * Stripe webhook when a purchase completes a reward (see lib/loyalty). Resolves
 * the address from the Stripe customer at send time (never stored).
 * Idempotent via `rewardEmailSentAt`.
 */
export async function POST(req: Request) {
  let body: Body;
  try {
    body = await verifyQstashRequest<Body>(req);
  } catch (err) {
    await logtail.error(
      `API /tasks/send-reward-email: signature verification failed: ${err}`
    );
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { rewardId } = body;
  if (!rewardId) {
    return NextResponse.json({ error: 'Missing rewardId' }, { status: 400 });
  }

  try {
    const payload = await getPayload({ config: payloadConfig });

    const reward = await payload.findByID({
      collection: 'rewards',
      id: rewardId,
      depth: 0,
      disableErrors: true,
    });
    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }
    // Already sent, or voided by a refund before we got to it — nothing to do.
    if (reward.rewardEmailSentAt || reward.voidedAt) {
      return NextResponse.json({ received: true, skipped: true }, { status: 200 });
    }

    const email = await getCustomerEmail(reward.customerId);
    if (!email) {
      await logtail.error(
        `API /tasks/send-reward-email: no deliverable address for reward ${rewardId}`
      );
      return NextResponse.json({ error: 'No recipient' }, { status: 400 });
    }

    const { error: sendError } = await resend.emails.send({
      from: ZVC_EMAIL_ADDRESS,
      subject: 'You earned a free ticket — Zero Vision Cinema',
      to: email,
      react: <RewardEmail code={reward.code} expiresAt={reward.expiresAt} />,
    });
    if (sendError) {
      throw new Error(
        `Resend error: ${sendError.message ?? JSON.stringify(sendError)}`
      );
    }

    await payload.update({
      collection: 'rewards',
      id: rewardId,
      data: { rewardEmailSentAt: new Date().toISOString() },
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    await logtail.error(
      `API /tasks/send-reward-email: send failed for reward ${rewardId}: ${err}`,
      { method: 'POST', timestamp: new Date().toISOString() }
    );
    return NextResponse.json(
      { error: 'Failed to send reward email' },
      { status: 500 }
    );
  }
}
