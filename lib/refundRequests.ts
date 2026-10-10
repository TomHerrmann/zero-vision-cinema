import { sql } from '@payloadcms/db-vercel-postgres';
import type { Payload } from 'payload';
import { stripeCheckout } from '@/lib/stripe';
import { logtail } from '@/lib/logtail';
import { qstash, QSTASH_TARGET_BASE_URL } from '@/lib/qstash';
import { isQualifyingOrder, isRewardUsable, voidUsableRewardsForCustomer } from '@/lib/loyalty';
import { refundDeclinedEmailReady } from '@/emails/RefundDeclinedEmail';
import type { Event, Order, RefundRequest, Reward } from '@/payload-types';

/**
 * Refunds inside 48 hours of an event are approved by hand: a request is filed
 * (by the buyer's link or by an admin), we're emailed, and nothing moves until an admin clicks Approve or
 * Decline on the request in the admin. Approve issues the Stripe refund; the
 * `charge.refunded` webhook then does what it always did (order refunded,
 * seats freed, loyalty, refund email).
 *
 * Status changes are single conditional UPDATEs (`WHERE status = 'pending'`) so
 * a double click or two admins at once can't approve twice, and the Stripe
 * refund carries an idempotency key per PaymentIntent as a second guard.
 */

const SOURCE = 'lib/refundRequests';

export type Result<T = object> =
  | ({ ok: true } & T)
  | { ok: false; status: number; error: string };

function relId(rel: number | { id: number } | null | undefined): number | null {
  if (!rel) return null;
  return typeof rel === 'object' ? rel.id : rel;
}

/** Run a raw statement on the Postgres adapter and return its rows. */
async function execute<T>(payload: Payload, query: ReturnType<typeof sql>): Promise<T[]> {
  const db = payload.db as unknown as {
    drizzle: { execute: (q: unknown) => Promise<{ rows: T[] }> };
  };
  const result = await db.drizzle.execute(query);
  return result.rows;
}

async function findPending(payload: Payload, orderId: number): Promise<RefundRequest | null> {
  const { docs } = await payload.find({
    collection: 'refund-requests',
    depth: 0,
    limit: 1,
    where: {
      and: [{ order: { equals: orderId } }, { status: { equals: 'pending' } }],
    },
  });
  return docs[0] ?? null;
}

/**
 * File a request for an order, or return the one already pending. `buyer`
 * requests email us; `admin` ones don't (the admin is already looking at it).
 */
export async function createRefundRequest(
  payload: Payload,
  orderId: number,
  source: 'buyer' | 'admin',
  now: Date = new Date()
): Promise<Result<{ id: number; existing: boolean }>> {
  if (!orderId) return { ok: false, status: 400, error: 'Missing order' };

  const order = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 0,
    disableErrors: true,
  });
  if (!order) return { ok: false, status: 404, error: 'Order not found' };
  if (order.refundedAt) {
    return { ok: false, status: 409, error: 'This order has already been refunded.' };
  }
  if (!order.paymentIntentId) {
    return {
      ok: false,
      status: 400,
      error: 'This order has no Stripe payment to refund (free or legacy order).',
    };
  }

  const pending = await findPending(payload, orderId);
  if (pending) return { ok: true, id: pending.id, existing: true };

  const request = await payload.create({
    collection: 'refund-requests',
    data: {
      order: orderId,
      customerId: order.customerId,
      status: 'pending',
      source,
      requestedAt: now.toISOString(),
    },
  });

  if (source === 'buyer') await enqueueRefundRequestEmail(request.id);

  return { ok: true, id: request.id, existing: false };
}

/** Email us about a new request. Never throws: the request is already saved. */
export async function enqueueRefundRequestEmail(requestId: number): Promise<void> {
  try {
    await qstash.publishJSON({
      url: `${QSTASH_TARGET_BASE_URL}/api/tasks/send-refund-request-email`,
      body: { requestId },
      deduplicationId: `refund-request-email-${requestId}`,
      retries: 3,
    });
  } catch (err) {
    await logtail.error(
      `${SOURCE}: failed to enqueue refund-request email for request ${requestId}: ${err}`,
      { method: 'POST', timestamp: new Date().toISOString() }
    );
  }
}

/**
 * Approve: claim the request, issue the full Stripe refund, and (if asked) void
 * the buyer's unused free-ticket codes. A code the refunded order itself helped
 * earn is left to the webhook, which already voids it and releases the other
 * purchases. Codes voided here keep their purchases used up, so they don't come
 * back as progress toward a new code.
 */
export async function approveRefundRequest(
  payload: Payload,
  requestId: number,
  { userId, voidRewards }: { userId: number; voidRewards: boolean }
): Promise<Result<{ refundId: string; voidedCodes: string[] }>> {
  if (!requestId) return { ok: false, status: 400, error: 'Missing request' };

  const claimed = await execute<{ id: number; order_id: number; customer_id: string }>(
    payload,
    sql`UPDATE "refund_requests"
        SET "status" = 'approved', "decided_at" = now(), "decided_by_id" = ${userId}, "updated_at" = now()
        WHERE "id" = ${requestId} AND "status" = 'pending'
        RETURNING "id", "order_id", "customer_id"`
  );
  const row = claimed[0];
  if (!row) {
    return { ok: false, status: 409, error: 'This request was already decided.' };
  }

  const revert = () =>
    execute(
      payload,
      sql`UPDATE "refund_requests"
          SET "status" = 'pending', "decided_at" = NULL, "decided_by_id" = NULL, "updated_at" = now()
          WHERE "id" = ${requestId}`
    );

  const order = await payload.findByID({
    collection: 'orders',
    id: row.order_id,
    depth: 0,
    disableErrors: true,
  });
  if (!order?.paymentIntentId) {
    await revert();
    return { ok: false, status: 400, error: 'The order has no Stripe payment to refund.' };
  }

  let refundId: string;
  try {
    const refund = await stripeCheckout.refunds.create(
      {
        payment_intent: order.paymentIntentId,
        reason: 'requested_by_customer',
        metadata: { refundRequestId: String(requestId), orderId: String(order.id) },
      },
      { idempotencyKey: `refund-request-${order.paymentIntentId}` }
    );
    refundId = refund.id;
  } catch (err) {
    await revert();
    await logtail.error(`${SOURCE}: Stripe refund failed for request ${requestId}: ${err}`, {
      method: 'POST',
      timestamp: new Date().toISOString(),
    });
    return { ok: false, status: 502, error: `Stripe refused the refund: ${String(err)}` };
  }

  let voidedCodes: string[] = [];
  if (voidRewards) {
    try {
      voidedCodes = await voidUsableRewardsForCustomer(payload, row.customer_id, {
        exceptRewardId: relId(order.earnedReward),
        reason: `Voided on approving refund request ${requestId} (order ${order.id})`,
      });
    } catch (err) {
      // The refund already went through; report it rather than failing.
      await logtail.error(`${SOURCE}: voiding codes failed for request ${requestId}: ${err}`, {
        method: 'POST',
        timestamp: new Date().toISOString(),
      });
    }
  }

  await payload.update({
    collection: 'refund-requests',
    id: requestId,
    data: {
      stripeRefundId: refundId,
      voidedRewardCodes: voidedCodes.length ? voidedCodes.join(', ') : null,
    },
  });

  return { ok: true, refundId, voidedCodes };
}

/** Decline: close the request and queue the decline email to the buyer. */
export async function declineRefundRequest(
  payload: Payload,
  requestId: number,
  { userId }: { userId: number }
): Promise<Result<{ declineEmail: boolean }>> {
  if (!requestId) return { ok: false, status: 400, error: 'Missing request' };

  const claimed = await execute<{ id: number }>(
    payload,
    sql`UPDATE "refund_requests"
        SET "status" = 'declined', "decided_at" = now(), "decided_by_id" = ${userId}, "updated_at" = now()
        WHERE "id" = ${requestId} AND "status" = 'pending'
        RETURNING "id"`
  );
  if (!claimed[0]) {
    return { ok: false, status: 409, error: 'This request was already decided.' };
  }

  try {
    await qstash.publishJSON({
      url: `${QSTASH_TARGET_BASE_URL}/api/tasks/send-refund-declined-email`,
      body: { requestId },
      deduplicationId: `refund-declined-email-${requestId}`,
      retries: 3,
    });
  } catch (err) {
    await logtail.error(
      `${SOURCE}: failed to enqueue decline email for request ${requestId}: ${err}`,
      { method: 'POST', timestamp: new Date().toISOString() }
    );
  }

  // False while the decline wording is unwritten: the task then sends nothing.
  return { ok: true, declineEmail: refundDeclinedEmailReady() };
}

export type RefundRequestSummary = {
  id: number;
  status: RefundRequest['status'];
  source: RefundRequest['source'];
  requestedAt: string;
  decidedAt: string | null;
  stripeRefundId: string | null;
  voidedRewardCodes: string | null;
  orderId: number;
  customerId: string;
  paymentIntentId: string | null;
  amountPaid: number;
  quantity: number;
  orderRefundedAt: string | null;
  eventName: string | null;
  eventDate: string | null;
  eventPassed: boolean;
  loyalty: {
    /** The order counts toward the buyer's current free-ticket progress. */
    countsTowardProgress: boolean;
    /** The order helped earn this code; the refund voids it automatically if unused. */
    earnedCode: string | null;
    /** Other unused codes the buyer holds (the "void their code" checkbox). */
    otherUsableCodes: string[];
  };
};

/** Everything the decision panel and our notification email show. */
export async function getRefundRequestSummary(
  payload: Payload,
  requestId: number,
  now: Date = new Date()
): Promise<RefundRequestSummary | null> {
  const request = await payload.findByID({
    collection: 'refund-requests',
    id: requestId,
    depth: 0,
    disableErrors: true,
  });
  if (!request) return null;

  const order = (await payload.findByID({
    collection: 'orders',
    id: relId(request.order) ?? 0,
    depth: 0,
    disableErrors: true,
  })) as Order | null;
  if (!order) return null;

  const eventId = order.item?.relationTo === 'events' ? relId(order.item.value) : null;
  const event_ = eventId
    ? ((await payload.findByID({
        collection: 'events',
        id: eventId,
        depth: 0,
        disableErrors: true,
      })) as Event | null)
    : null;

  const { docs: rewards } = await payload.find({
    collection: 'rewards',
    depth: 0,
    pagination: false,
    where: { customerId: { equals: order.customerId } },
  });
  const earnedId = relId(order.earnedReward);
  const earned = rewards.find((r: Reward) => r.id === earnedId);

  return {
    id: request.id,
    status: request.status,
    source: request.source,
    requestedAt: request.requestedAt,
    decidedAt: request.decidedAt ?? null,
    stripeRefundId: request.stripeRefundId ?? null,
    voidedRewardCodes: request.voidedRewardCodes ?? null,
    orderId: order.id,
    customerId: order.customerId,
    paymentIntentId: order.paymentIntentId ?? null,
    amountPaid: order.amountPaid,
    quantity: order.quantity,
    orderRefundedAt: order.refundedAt ?? null,
    eventName: event_?.name ?? null,
    eventDate: event_?.datetime ?? null,
    eventPassed: event_ ? new Date(event_.datetime).getTime() < now.getTime() : false,
    loyalty: {
      countsTowardProgress: isQualifyingOrder({ ...order, refundedAt: null }, now),
      earnedCode: earned && isRewardUsable(earned, now) ? earned.code : null,
      otherUsableCodes: rewards
        .filter((r: Reward) => r.id !== earnedId && isRewardUsable(r, now))
        .map((r: Reward) => r.code),
    },
  };
}
