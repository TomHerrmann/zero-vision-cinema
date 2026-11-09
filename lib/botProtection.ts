import { NextResponse } from 'next/server';
import { checkBotId } from 'botid/server';
import { logtail } from '@/lib/logtail';

/**
 * Vercel BotID check for a public endpoint (Basic mode: free on every plan,
 * invisible to visitors). Returns a 403 response when the request is flagged
 * as a bot, or null when it may proceed.
 *
 * Fails open: if the check itself errors, the request goes through, so an
 * outage on Vercel's side never blocks a real buyer.
 *
 * The 403 body carries no message, so each form falls back to its own
 * existing error text. The route must also be listed in
 * lib/botProtectedRoutes.ts, or real browsers won't send the challenge.
 */
export async function blockBots(route: string): Promise<NextResponse | null> {
  let isBot = false;
  try {
    ({ isBot } = await checkBotId());
  } catch (err) {
    await logtail.warn(`${route}: BotID check failed, allowing request: ${err}`);
    return null;
  }
  if (!isBot) return null;

  await logtail.warn(`${route}: blocked a request BotID flagged as a bot`);
  return NextResponse.json({ blocked: true }, { status: 403 });
}
