import { describe, it, expect } from 'vitest';
import { signRefundToken, verifyRefundToken } from './refundToken';

describe('refund token', () => {
  it('verifies a token it signed', () => {
    const token = signRefundToken(42);
    expect(verifyRefundToken(42, token)).toBe(true);
  });

  it('rejects a token for a different order', () => {
    const token = signRefundToken(42);
    expect(verifyRefundToken(43, token)).toBe(false);
  });

  it('rejects a tampered or empty token', () => {
    const token = signRefundToken(42);
    expect(verifyRefundToken(42, token + 'x')).toBe(false);
    expect(verifyRefundToken(42, '')).toBe(false);
  });

  it('is deterministic for the same order', () => {
    expect(signRefundToken(7)).toBe(signRefundToken(7));
    expect(signRefundToken(7)).not.toBe(signRefundToken(8));
  });
});
