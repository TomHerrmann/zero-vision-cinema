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
 * Absolute base URL QStash calls back to reach our task endpoints. Set
 * NEXT_PUBLIC_BASE_URL to the deployment's public https origin; falls back to
 * the production domain. Must be publicly reachable — cloud QStash cannot call
 * localhost or a private preview URL.
 */
export const QSTASH_TARGET_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? ZVC_SITE_URL;

function isLocalUrl(url?: string | null): boolean {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    return (
      hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
    );
  } catch {
    return false;
  }
}

/**
 * Whether QStash could actually deliver to `QSTASH_TARGET_BASE_URL`. Cloud QStash
 * can't reach localhost, so publishing from a local dev server that isn't pointed
 * at the QStash dev server (`npx @upstash/qstash-cli dev`, which sets a localhost
 * QSTASH_URL) only creates messages that burn their retries and dead-letter.
 * True when the target is public, or when the target and QStash are both local.
 */
export const QSTASH_DELIVERY_ENABLED =
  !isLocalUrl(QSTASH_TARGET_BASE_URL) || isLocalUrl(process.env.QSTASH_URL);

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
