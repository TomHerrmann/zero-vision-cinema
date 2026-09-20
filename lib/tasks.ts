import { logtail } from '@/lib/logtail';
import { qstash, QSTASH_TARGET_BASE_URL } from '@/lib/qstash';

/**
 * Enqueue the ticket-email task for an order. Returns false (rather than
 * throwing) when QStash refuses the message, so the caller can decide whether
 * to fail the request and let the sender retry.
 *
 * `deduplicationId` is keyed on `dedupKey` (the PaymentIntent, or the reward
 * for free orders) so a redelivery can't double-publish; the task's
 * `ticketEmailSentAt` guard covers the same ground once QStash's dedup window
 * has passed.
 */
export async function enqueueTicketEmail({
  orderId,
  dedupKey,
  email,
  source,
}: {
  orderId: number;
  dedupKey: string;
  email?: string;
  source: string;
}): Promise<boolean> {
  try {
    await qstash.publishJSON({
      url: `${QSTASH_TARGET_BASE_URL}/api/tasks/send-ticket-email`,
      // Without `email` the task resolves it from the order's Stripe customer.
      body: email ? { orderId, email } : { orderId },
      deduplicationId: `ticket-email-${dedupKey}`,
      retries: 3,
      failureCallback: `${QSTASH_TARGET_BASE_URL}/api/tasks/send-ticket-email/failure`,
    });
    return true;
  } catch (enqueueErr) {
    await logtail.error(
      `${source}: failed to enqueue ticket email for order ${orderId}: ${enqueueErr}`,
      { method: 'POST', timestamp: new Date().toISOString() }
    );
    return false;
  }
}

/**
 * Enqueue the loyalty reward email. Never throws: a missed reward email is
 * logged for manual follow-up rather than failing the purchase that earned it.
 */
export async function enqueueRewardEmail(rewardId: number, source: string): Promise<void> {
  try {
    await qstash.publishJSON({
      url: `${QSTASH_TARGET_BASE_URL}/api/tasks/send-reward-email`,
      body: { rewardId },
      deduplicationId: `reward-email-${rewardId}`,
      retries: 3,
      failureCallback: `${QSTASH_TARGET_BASE_URL}/api/tasks/send-reward-email/failure`,
    });
  } catch (enqueueErr) {
    await logtail.error(
      `${source}: failed to enqueue reward email for reward ${rewardId}: ${enqueueErr}`,
      { method: 'POST', timestamp: new Date().toISOString() }
    );
  }
}
