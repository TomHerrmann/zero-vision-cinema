import { Logtail } from '@logtail/node';

// A resilient logging wrapper. Logging must never throw into — or mask — an
// application error path. Previously an invalid/absent BetterStack ingest token
// caused Logtail's `_sync` flush to reject with "Unauthorized", which surfaced
// as the request's error. If no token is configured we no-op; otherwise every
// call is caught and swallowed.
// BetterStack provisions each source with a region-specific ingesting host
// (e.g. s1234567.xx-xxx-x.betterstackdata.com). The SDK otherwise defaults to
// https://in.logs.betterstack.com, which 401s ("Unauthorized") if the source
// lives elsewhere — set BETTERSTACK_INGESTING_HOST to the source's ingesting
// host. Accepts a bare host or a full URL; the https:// scheme is added if
// missing (the SDK requires a scheme to pick its transport).
const token = process.env.BETTERSTACK_SOURCE_TOKEN;
const host = process.env.BETTERSTACK_INGESTING_HOST?.trim();
const endpoint = host
  ? /^https?:\/\//.test(host)
    ? host
    : `https://${host}`
  : undefined;
const client = token
  ? new Logtail(token, endpoint ? { endpoint } : undefined)
  : null;

type Context = Record<string, unknown>;

async function safe(
  level: 'error' | 'info' | 'warn',
  message: string,
  context?: Context
): Promise<void> {
  // Mirror to the console FIRST, always. BetterStack has been silently
  // rejecting our token, and because this wrapper swallows that, every
  // logtail.error in the app became a no-op — a 500 in a task route left no
  // trace anywhere. Vercel captures console output per request, so this is the
  // channel that actually works. Errors and warnings only: info would be noise.
  if (level === 'error' || level === 'warn') {
    let line = message;
    if (context) {
      try {
        line = `${message} ${JSON.stringify(context)}`;
      } catch {
        // Circular or otherwise unserialisable context — the message matters more.
      }
    }
    if (level === 'error') console.error(line);
    else console.warn(line);
  }

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
