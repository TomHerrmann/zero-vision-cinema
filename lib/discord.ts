/**
 * Discord incoming-webhook client. A webhook URL is itself the credential — no
 * bot token, no gateway connection — so posting is one signed-by-possession
 * POST. `utils/discordEmbed.ts` builds the body; this only ships it.
 */

import type { DiscordWebhookPayload } from '@/utils/discordEmbed';

/**
 * Post a message to the ZVC Discord channel. Throws on any non-2xx — including
 * 429, whose retry is better handled by QStash's backoff than by sleeping
 * inside a serverless request — so the calling task returns 500 and QStash
 * retries. Mirrors how the Resend broadcast call reports failures.
 */
export async function postDiscordWebhook(
  /** Channel webhook from Discord: Channel settings → Integrations → Webhooks. */
  webhookUrl: string,
  payload: DiscordWebhookPayload
): Promise<void> {
  // `wait=true` makes Discord validate the embed and return the created message
  // instead of a fire-and-forget 204, so a malformed embed fails loudly here
  // rather than vanishing.
  const res = await fetch(`${webhookUrl}?wait=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Discord webhook ${res.status}: ${await res.text()}`);
  }
}
