import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import path from 'path';
import { checkBotId } from 'botid/server';

const h = vi.hoisted(() => ({ warn: vi.fn() }));
vi.mock('@/lib/logtail', () => ({
  logtail: { error: vi.fn(), info: vi.fn(), warn: h.warn },
}));

import { blockBots } from './botProtection';
import { BOT_PROTECTED_ROUTES } from './botProtectedRoutes';

const check = vi.mocked(checkBotId);

beforeEach(() => {
  h.warn.mockReset();
  check.mockReset().mockResolvedValue({ isBot: false } as never);
});

describe('blockBots', () => {
  it('lets a human request through', async () => {
    expect(await blockBots('API /test')).toBeNull();
  });

  it('returns a 403 with no message when BotID flags a bot', async () => {
    check.mockResolvedValue({ isBot: true } as never);
    const res = await blockBots('API /test');
    expect(res?.status).toBe(403);
    // No `error` text: forms fall back to their own existing messages.
    expect(await res?.json()).toEqual({ blocked: true });
    expect(h.warn).toHaveBeenCalled();
  });

  it('fails open when the check itself errors', async () => {
    check.mockRejectedValue(new Error('BotID unavailable'));
    expect(await blockBots('API /test')).toBeNull();
    expect(h.warn).toHaveBeenCalled();
  });
});

// The client list (instrumentation-client.ts) and the server calls must match:
// a listed route with no server check is unprotected, and a checked route
// that isn't listed blocks every real browser in production.
describe('protected route list', () => {
  const root = path.resolve(__dirname, '..');
  const apiDir = path.join(root, 'app/api');

  const routeFiles = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const p = path.join(dir, name);
      if (statSync(p).isDirectory()) return routeFiles(p);
      return /^route\.tsx?$/.test(name) ? [p] : [];
    });

  const urlFor = (file: string) =>
    '/' + path.relative(path.join(root, 'app'), path.dirname(file)).split(path.sep).join('/');

  const checked = routeFiles(apiDir)
    .filter((f) => readFileSync(f, 'utf8').includes('blockBots('))
    .map(urlFor)
    .sort();

  it('every route that calls blockBots is listed, and vice versa', () => {
    const listed = BOT_PROTECTED_ROUTES.map((r) => r.path).sort();
    expect(checked).toEqual(listed);
  });
});
