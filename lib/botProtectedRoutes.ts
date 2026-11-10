/**
 * Public endpoints that BotID guards. The browser attaches a BotID challenge
 * solution to requests matching these (see instrumentation-client.ts), and
 * each route calls `blockBots()` from lib/botProtection.ts to verify it.
 *
 * Adding a route here without calling `blockBots()` in it does nothing on the
 * server; calling `blockBots()` in a route that isn't listed here blocks every
 * request to it in production (no challenge is sent). Keep the two in step;
 * lib/botProtection.test.ts checks that they are.
 */
export const BOT_PROTECTED_ROUTES = [
  { path: '/api/contact', method: 'POST' },
  { path: '/api/subscribe', method: 'POST' },
  { path: '/api/stripe/payment-intent', method: 'POST' },
  { path: '/api/rewards/validate', method: 'POST' },
  { path: '/api/rewards/redeem', method: 'POST' },
] as const;
