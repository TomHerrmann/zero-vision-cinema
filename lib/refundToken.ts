import { createHmac, timingSafeEqual } from 'crypto';

// HMAC signs refund links so a bare order number can't be used to refund/
// invalidate someone else's ticket. The token travels only in the buyer's
// emailed link. Uses a dedicated secret if set, else the Payload secret.
// TODO - create a dedicated secret for this purpose, so the Payload secret can be rotated without invalidating refund links.
const SECRET = process.env.REFUND_TOKEN_SECRET ?? '';

export function signRefundToken(orderId: number): string {
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
