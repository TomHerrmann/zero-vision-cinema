import { Client, Receiver } from '@upstash/qstash';
import { ZVC_SITE_URL } from '@/app/contsants/constants';

/**
 * QStash message-queue client. Used to enqueue durable, retried background work
 * (e.g. the post-purchase ticket email) so it doesn't block — or get swallowed
 * by — the request that triggered it. Fulfillment tasks live under
 * `app/api/tasks/*` and verify the QStash signature via `verifyQstashRequest`.
 */
export const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
});

/**
 * Absolute base URL QStash calls back to reach our task endpoints. Defaults to
 * the production domain; override with APP_BASE_URL on preview deployments.
 */
export const QSTASH_TARGET_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? ZVC_SITE_URL;

/**
 * Verify an incoming QStash request and return its parsed JSON body. Throws if
 * the `Upstash-Signature` header is missing or invalid so task routes can 401.
 * Consumes the request body (raw text needed for signature verification).
 */
export async function verifyQstashRequest<T = unknown>(
  req: Request
): Promise<T> {
  const signature = req.headers.get('upstash-signature');
  if (!signature) throw new Error('Missing Upstash-Signature header');

  const body = await req.text();
  const valid = await receiver.verify({ signature, body });
  if (!valid) throw new Error('Invalid Upstash signature');

  return (body ? JSON.parse(body) : {}) as T;
}
