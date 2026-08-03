import { createHmac, timingSafeEqual } from 'crypto';

// HMAC signs refund links so a bare order number can't be used to refund/
// invalidate someone else's ticket. The token travels only in the buyer's
// emailed link. Requires a dedicated REFUND_TOKEN_SECRET (kept separate from
// PAYLOAD_SECRET so that secret can be rotated without invalidating refund
// links). If it isn't set, signing throws — surfaced loudly in the email
// worker's logs — rather than minting links that would silently 403 on verify.
const SECRET = process.env.REFUND_TOKEN_SECRET ?? '';

export function signRefundToken(orderId: number): string {
  if (!SECRET) {
    throw new Error('REFUND_TOKEN_SECRET is not set — cannot sign refund token');
  }
  return createHmac('sha256', SECRET)
    .update(`refund:${orderId}`)
    .digest('base64url');
}

export function verifyRefundToken(orderId: number, token: string): boolean {
  if (!token || !SECRET) return false;
  const expected = Buffer.from(signRefundToken(orderId));
  const provided = Buffer.from(token);
  return (
    expected.length === provided.length && timingSafeEqual(expected, provided)
  );
}
