import { randomInt } from 'crypto';
import { sql } from '@payloadcms/db-vercel-postgres';
import type { Payload } from 'payload';
import type { Order, Reward } from '@/payload-types';

/**
 * Loyalty rewards: `REWARD_PURCHASES` separate paid ticket purchases within a
 * rolling `WINDOW_DAYS` earns a single-use code for one free ticket, valid for
 * `REWARD_VALID_DAYS`.
 *
 * Buyers are identified by the Stripe customer id already stored on each order
 * (the webhook reuses one customer per email), so nothing here stores an email
 * or other PII.
 *
 * Every state change that two requests could race on — consuming orders into a
 * reward, redeeming a code, voiding one — is a single conditional SQL UPDATE, so
 * the database decides the winner.
 */
export const REWARD_PURCHASES = 3;
export const WINDOW_DAYS = 30;
export const REWARD_VALID_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

// No 0/O, 1/I/L — codes get read off phones and typed by hand.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

type QualifyingFields = Pick<
  Order,
  | 'id'
  | 'amountPaid'
  | 'transactionDate'
  | 'refundedAt'
  | 'item'
  | 'earnedReward'
  | 'redeemedReward'
>;

export type LoyaltyStatus = {
  /** Qualifying purchases so far in the current window. */
  count: number;
  /** Purchases still needed for a free ticket (0 when one is due). */
  remaining: number;
  /** When the oldest counted purchase ages out of the window (ISO), if any. */
  deadline: string | null;
};

/** `ZVC-XXXX-XXXX`, drawn with a CSPRNG. */
export function generateRewardCode(): string {
  const pick = (n: number) =>
    Array.from({ length: n }, () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]).join('');
  return `ZVC-${pick(4)}-${pick(4)}`;
}

/** Canonicalize user input: case, spaces and dashes don't matter. */
export function normalizeRewardCode(input: string): string {
  const s = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (s.length === 11 && s.startsWith('ZVC')) {
    return `ZVC-${s.slice(3, 7)}-${s.slice(7)}`;
  }
  return s;
}

/**
 * Whether an order counts toward a reward: a paid (not free), unrefunded ticket
 * purchase inside the window that hasn't already been counted toward one.
 */
export function isQualifyingOrder(order: QualifyingFields, now: Date): boolean {
  const cutoff = now.getTime() - WINDOW_DAYS * DAY_MS;
  return (
    order.item?.relationTo === 'events' &&
    Number(order.amountPaid) > 0 &&
    !order.refundedAt &&
    !order.earnedReward &&
    !order.redeemedReward &&
    new Date(order.transactionDate).getTime() > cutoff
  );
}

/** Progress from a customer's qualifying orders (oldest first). */
export function computeLoyaltyStatus(
  qualifying: Pick<Order, 'transactionDate'>[],
  _now: Date
): LoyaltyStatus {
  const count = qualifying.length;
  const oldest = qualifying[0];
  return {
    count,
    remaining: Math.max(0, REWARD_PURCHASES - count),
    deadline: oldest
      ? new Date(new Date(oldest.transactionDate).getTime() + WINDOW_DAYS * DAY_MS).toISOString()
      : null,
  };
}

/** A reward that can still be used: not redeemed, voided, or expired. */
export function isRewardUsable(
  reward: Pick<Reward, 'redeemedAt' | 'voidedAt' | 'expiresAt'>,
  now: Date
): boolean {
  return (
    !reward.redeemedAt &&
    !reward.voidedAt &&
    new Date(reward.expiresAt).getTime() > now.getTime()
  );
}

/** Run a raw statement on the Postgres adapter and return its rows. */
async function execute<T>(payload: Payload, query: ReturnType<typeof sql>): Promise<T[]> {
  const db = payload.db as unknown as {
    drizzle: { execute: (q: unknown) => Promise<{ rows: T[] }> };
  };
  const result = await db.drizzle.execute(query);
  return result.rows;
}

/** A customer's qualifying orders, oldest first. */
export async function getQualifyingOrders(
  payload: Payload,
  customerId: string,
  now: Date = new Date()
): Promise<Order[]> {
  const cutoff = new Date(now.getTime() - WINDOW_DAYS * DAY_MS).toISOString();
  const { docs } = await payload.find({
    collection: 'orders',
    depth: 0,
    pagination: false,
    sort: 'transactionDate',
    where: {
      and: [
        { customerId: { equals: customerId } },
        { transactionDate: { greater_than: cutoff } },
      ],
    },
  });
  return docs.filter((o) => isQualifyingOrder(o, now));
}

export async function getLoyaltyStatus(
  payload: Payload,
  customerId: string,
  now: Date = new Date()
): Promise<LoyaltyStatus> {
  return computeLoyaltyStatus(await getQualifyingOrders(payload, customerId, now), now);
}

/**
 * Issue a reward if the customer has reached `REWARD_PURCHASES` qualifying
 * orders. The oldest ones are consumed with a conditional UPDATE (only orders
 * not already counted); if a concurrent call got some of them first, this
 * reward is rolled back and null returned — the other call issued it.
 */
export async function maybeIssueReward(
  payload: Payload,
  customerId: string,
  now: Date = new Date()
): Promise<Reward | null> {
  const qualifying = await getQualifyingOrders(payload, customerId, now);
  if (qualifying.length < REWARD_PURCHASES) return null;

  const orderIds = qualifying.slice(0, REWARD_PURCHASES).map((o) => o.id);
  const reward = await payload.create({
    collection: 'rewards',
    data: {
      code: generateRewardCode(),
      customerId,
      issuedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + REWARD_VALID_DAYS * DAY_MS).toISOString(),
    },
  });

  const claimed = await execute<{ id: number }>(
    payload,
    sql`UPDATE "orders" SET "earned_reward_id" = ${reward.id}, "updated_at" = now()
        WHERE "id" IN (${sql.join(orderIds.map((id) => sql`${id}`), sql`, `)})
          AND "earned_reward_id" IS NULL
        RETURNING "id"`
  );

  if (claimed.length < REWARD_PURCHASES) {
    await execute(
      payload,
      sql`UPDATE "orders" SET "earned_reward_id" = NULL WHERE "earned_reward_id" = ${reward.id}`
    );
    await payload.delete({ collection: 'rewards', id: reward.id });
    return null;
  }

  return reward;
}

/** Look up a code the buyer typed; null unless it exists and is usable. */
export async function findUsableReward(
  payload: Payload,
  input: string,
  now: Date = new Date()
): Promise<Reward | null> {
  const code = normalizeRewardCode(input);
  if (!code) return null;
  const { docs } = await payload.find({
    collection: 'rewards',
    depth: 0,
    limit: 1,
    where: { code: { equals: code } },
  });
  const reward = docs[0];
  return reward && isRewardUsable(reward, now) ? reward : null;
}

/**
 * Atomically mark a reward redeemed. False if it was redeemed, voided, or
 * expired in the meantime (another request won).
 */
export async function claimReward(payload: Payload, rewardId: number): Promise<boolean> {
  const rows = await execute<{ id: number }>(
    payload,
    sql`UPDATE "rewards" SET "redeemed_at" = now(), "updated_at" = now()
        WHERE "id" = ${rewardId}
          AND "redeemed_at" IS NULL
          AND "voided_at" IS NULL
          AND "expires_at" > now()
        RETURNING "id"`
  );
  return rows.length === 1;
}

/** Undo `claimReward` when the free order couldn't be created. */
export async function releaseRewardClaim(payload: Payload, rewardId: number): Promise<void> {
  await execute(
    payload,
    sql`UPDATE "rewards" SET "redeemed_at" = NULL, "updated_at" = now()
        WHERE "id" = ${rewardId} AND "redeemed_order_id" IS NULL`
  );
}

export type RefundRewardEffect =
  | { kind: 'voided'; code: string }
  | { kind: 'alreadyRedeemed'; code: string }
  | null;

/**
 * A refunded order that earned a reward breaks it: void the reward (if unused)
 * and release the other orders so they count toward progress again. The
 * refunded order keeps its `earnedReward` link so the refund email can name the
 * voided code. A reward that's already been redeemed is left alone — the free
 * ticket stands.
 */
export async function voidRewardForRefund(
  payload: Payload,
  order: Pick<Order, 'id' | 'earnedReward'>
): Promise<RefundRewardEffect> {
  const rewardId =
    typeof order.earnedReward === 'object' ? order.earnedReward?.id : order.earnedReward;
  if (!rewardId) return null;

  const voided = await execute<{ code: string }>(
    payload,
    sql`UPDATE "rewards"
        SET "voided_at" = now(), "void_reason" = ${`Order ${order.id} refunded`}, "updated_at" = now()
        WHERE "id" = ${rewardId} AND "redeemed_at" IS NULL AND "voided_at" IS NULL
        RETURNING "code"`
  );

  if (voided[0]) {
    await execute(
      payload,
      sql`UPDATE "orders" SET "earned_reward_id" = NULL, "updated_at" = now()
          WHERE "earned_reward_id" = ${rewardId} AND "id" <> ${order.id}`
    );
    return { kind: 'voided', code: voided[0].code };
  }

  const reward = await payload.findByID({
    collection: 'rewards',
    id: rewardId,
    depth: 0,
    disableErrors: true,
  });
  if (reward?.redeemedAt) return { kind: 'alreadyRedeemed', code: reward.code };
  return null;
}

/**
 * What the ticket / refund email says about the buyer's loyalty status.
 * - `progress`: N more purchases by `deadline` for a free ticket.
 * - `earned`: this purchase completed a reward (the code comes separately).
 * - `redeemed`: this order is the free ticket itself.
 * - `voided`: a refund cancelled an unused reward (plus the new progress).
 */
export type LoyaltyNotice =
  | { kind: 'progress'; remaining: number; deadline: string | null; afterRefund?: boolean }
  | { kind: 'earned' }
  | { kind: 'redeemed'; code: string }
  | { kind: 'voided'; code: string; remaining: number; deadline: string | null };

function relId(rel: number | { id: number } | null | undefined): number | null {
  if (!rel) return null;
  return typeof rel === 'object' ? rel.id : rel;
}

/** Loyalty block for the ticket email; null for non-event orders. */
export async function getTicketEmailNotice(
  payload: Payload,
  order: Order,
  now: Date = new Date()
): Promise<LoyaltyNotice | null> {
  if (order.item?.relationTo !== 'events') return null;

  const redeemedId = relId(order.redeemedReward);
  if (redeemedId) {
    const reward = await payload.findByID({
      collection: 'rewards',
      id: redeemedId,
      depth: 0,
      disableErrors: true,
    });
    return { kind: 'redeemed', code: reward?.code ?? '' };
  }

  if (relId(order.earnedReward)) return { kind: 'earned' };

  const status = await getLoyaltyStatus(payload, order.customerId, now);
  return { kind: 'progress', remaining: status.remaining, deadline: status.deadline };
}

/**
 * Loyalty block for the refund email — only when the refund changed something:
 * it voided a reward, or the order was counting toward one. Null otherwise.
 */
export async function getRefundEmailNotice(
  payload: Payload,
  order: Order,
  now: Date = new Date()
): Promise<LoyaltyNotice | null> {
  if (order.item?.relationTo !== 'events') return null;

  const earnedId = relId(order.earnedReward);
  if (earnedId) {
    const reward = await payload.findByID({
      collection: 'rewards',
      id: earnedId,
      depth: 0,
      disableErrors: true,
    });
    if (!reward?.voidedAt) return null; // already redeemed — nothing changed
    const status = await getLoyaltyStatus(payload, order.customerId, now);
    return {
      kind: 'voided',
      code: reward.code,
      remaining: status.remaining,
      deadline: status.deadline,
    };
  }

  // Was it counting toward progress before the refund?
  const wasQualifying = isQualifyingOrder({ ...order, refundedAt: null }, now);
  if (!wasQualifying) return null;

  const status = await getLoyaltyStatus(payload, order.customerId, now);
  return {
    kind: 'progress',
    remaining: status.remaining,
    deadline: status.deadline,
    afterRefund: true,
  };
}
