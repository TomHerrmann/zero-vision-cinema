import type { Payload } from 'payload';
import { stripe } from '@/lib/stripe';
import { CLOSES_AFTER_MINUTES } from '@/utils/eventEnded';

/**
 * Deactivate the hosted Stripe payment link of every event whose sales have
 * closed (an hour after the start, see `utils/eventEnded.ts`).
 *
 * Those links go out in announcement emails and stay buyable on Stripe's side
 * after the event page itself redirects away, so they have to be switched off
 * in Stripe. Runs from the `retire-payment-links` task, which the daily
 * dispatcher schedules for the moment each of today's events closes, and as a
 * catch-up sweep on the daily run itself.
 *
 * Works from Stripe's list of *active* links rather than from the events, so
 * it is idempotent, catches up after missed runs, and also handles events
 * saved before `paymentLinkId` existed (which only store the URL). Once
 * retired a link drops out of that list, so the cost stays at roughly the
 * number of upcoming events.
 */
export async function retireClosedPaymentLinks(
  payload: Payload,
  now: Date = new Date()
): Promise<string[]> {
  // Anything that started at least CLOSES_AFTER_MINUTES ago is closed.
  const cutoff = new Date(now.getTime() - CLOSES_AFTER_MINUTES * 60 * 1000);
  const { docs: closedEvents } = await payload.find({
    collection: 'events',
    where: {
      datetime: { less_than_equal: cutoff.toISOString() },
      paymentLink: { exists: true },
    },
    limit: 1000,
    pagination: false,
    depth: 0,
  });
  if (closedEvents.length === 0) return [];

  // Collect first, then update: deactivating while paginating the same
  // `active: true` listing would shift the pages under the cursor.
  const activeLinks: { id: string; url: string }[] = [];
  for await (const link of stripe.paymentLinks.list({
    active: true,
    limit: 100,
  })) {
    activeLinks.push({ id: link.id, url: link.url });
  }

  const retired: string[] = [];
  for (const link of activeLinks) {
    const isClosed = closedEvents.some(
      (e) => e.paymentLinkId === link.id || e.paymentLink === link.url
    );
    if (!isClosed) continue;
    await stripe.paymentLinks.update(link.id, { active: false });
    retired.push(link.id);
  }

  return retired;
}
