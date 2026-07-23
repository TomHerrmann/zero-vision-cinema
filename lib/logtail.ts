import { Logtail } from '@logtail/node';

// A resilient logging wrapper. Logging must never throw into — or mask — an
// application error path. Previously an invalid/absent BetterStack ingest token
// caused Logtail's `_sync` flush to reject with "Unauthorized", which surfaced
// as the request's error. If no token is configured we no-op; otherwise every
// call is caught and swallowed.
const token = process.env.BETTERSTACK_SOURCE_TOKEN;
const client = token ? new Logtail(token) : null;

type Context = Record<string, unknown>;

async function safe(
  level: 'error' | 'info' | 'warn',
  message: string,
  context?: Context
): Promise<void> {
  if (!client) return;
  try {
    await client[level](message, context);
  } catch {
    // Intentionally ignore logging failures.
  }
}

export const logtail = {
  error: (message: string, context?: Context) => safe('error', message, context),
  info: (message: string, context?: Context) => safe('info', message, context),
  warn: (message: string, context?: Context) => safe('warn', message, context),
};
