import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@upstash/qstash', () => ({
  Client: class {},
  Receiver: class {},
}));

const CLOUD_QSTASH = 'https://qstash-us-east-1.upstash.io';
const LOCAL_QSTASH = 'http://localhost:8080';

/** Computed once at module load, so each case sets its env and re-imports. */
async function load(env: {
  NEXT_PUBLIC_BASE_URL?: string;
  QSTASH_URL?: string;
}) {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_BASE_URL', env.NEXT_PUBLIC_BASE_URL);
  vi.stubEnv('QSTASH_URL', env.QSTASH_URL);
  return import('./qstash');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('QSTASH_DELIVERY_ENABLED', () => {
  it('is enabled for a public target (production)', async () => {
    const { QSTASH_DELIVERY_ENABLED } = await load({
      NEXT_PUBLIC_BASE_URL: 'https://zerovisioncinema.com',
      QSTASH_URL: CLOUD_QSTASH,
    });
    expect(QSTASH_DELIVERY_ENABLED).toBe(true);
  });

  it('is disabled for a localhost target on cloud QStash', async () => {
    // The footgun: cloud QStash accepts the publish but can never call back, so
    // the message burns its retries and dead-letters.
    const { QSTASH_DELIVERY_ENABLED } = await load({
      NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
      QSTASH_URL: CLOUD_QSTASH,
    });
    expect(QSTASH_DELIVERY_ENABLED).toBe(false);
  });

  it('is enabled for a localhost target on the local QStash dev server', async () => {
    const { QSTASH_DELIVERY_ENABLED } = await load({
      NEXT_PUBLIC_BASE_URL: 'http://localhost:3000',
      QSTASH_URL: LOCAL_QSTASH,
    });
    expect(QSTASH_DELIVERY_ENABLED).toBe(true);
  });

  it('is enabled when NEXT_PUBLIC_BASE_URL is unset (falls back to the prod domain)', async () => {
    const { QSTASH_DELIVERY_ENABLED } = await load({
      NEXT_PUBLIC_BASE_URL: undefined,
      QSTASH_URL: undefined,
    });
    expect(QSTASH_DELIVERY_ENABLED).toBe(true);
  });
});
