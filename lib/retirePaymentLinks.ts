import type { Payload } from 'payload';
import { stripe } from '@/lib/stripe';
import { etDayRangeUtc } from '@/utils/broadcastSchedule';

/**
 * Deactivate the hosted Stripe payment link of every event whose day is over.
 *
 * Those links go out in announcement emails and stay buyable on Stripe's side
 * long after the event page itself redirects away, so they have to be switched
 * off in Stripe. Called from the daily 9am ET dispatcher; anything dated before
 * today in ET is over (see `utils/eventEnded.ts`).
 *
 * Works from Stripe's list of *active* links rather than from the events, so
 * it is idempotent, catches up after missed runs, and also handles events
 * saved before `paymentLinkId` existed (which only store the URL). Once
 * retired a link drops out of that list, so the daily cost stays at roughly
 * the number of upcoming events.
 */
export async function retirePastPaymentLinks(
  payload: Payload,
  now: Date = new Date()
): Promise<string[]> {
  const { start: todayStart } = etDayRangeUtc(now, 0);

  const { docs: pastEvents } = await payload.find({
    collection: 'events',
    where: {
      datetime: { less_than: todayStart.toISOString() },
      paymentLink: { exists: true },
    },
    limit: 1000,
    pagination: false,
    depth: 0,
  });
  if (pastEvents.length === 0) return [];

  const pastIds = new Set<string>();
  const pastUrls = new Set<string>();
  for (const event of pastEvents) {
    if (event.paymentLinkId) pastIds.add(event.paymentLinkId);
    if (event.paymentLink) pastUrls.add(event.paymentLink);
  }

  // Collect first, then update: deactivating while paginating the same
  // `active: true` listing would shift the pages under the cursor.
  const toRetire: string[] = [];
  for await (const link of stripe.paymentLinks.list({
    active: true,
    limit: 100,
  })) {
    if (pastIds.has(link.id) || pastUrls.has(link.url)) toRetire.push(link.id);
  }

  for (const id of toRetire) {
    await stripe.paymentLinks.update(id, { active: false });
  }

  return toRetire;
}
