import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-08-01',
});

/**
 * Separate client on the account's default (modern) API version for Embedded
 * Checkout (`ui_mode: 'embedded'`), which the pinned 2022-08-01 version above
 * predates. Kept separate so the legacy webhook (which reads the removed
 * `paymentIntent.charges`) is unaffected.
 */
export const stripeCheckout = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Runtime is stripe@18 (supports Embedded Checkout). The `as` cast sidesteps
  // a types clash from a nested stripe@10 copy under @payloadcms/plugin-stripe
  // that otherwise pins the apiVersion literal to an old version.
  apiVersion: '2025-08-27.basil' as Stripe.LatestApiVersion,
});

/**
 * Resolve a customer's email from Stripe by customer id. We store the Stripe
 * customer id on the order (not the email) and look it up at send time, so we
 * never persist customer emails ourselves. Returns null if the customer was
 * deleted or has no email; throws on transient Stripe errors (so callers can
 * retry).
 */
export async function getCustomerEmail(
  customerId: string
): Promise<string | null> {
  const customer = await stripeCheckout.customers.retrieve(customerId);
  if ('deleted' in customer && customer.deleted) return null;
  return (customer as Stripe.Customer).email ?? null;
}

const CARD_BRAND_LABELS: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  diners: 'Diners Club',
  jcb: 'JCB',
  unionpay: 'UnionPay',
};

export type ReceiptDetails = {
  cardBrand?: string;
  cardLast4?: string;
  currency?: string;
  receiptUrl?: string;
};

/**
 * Receipt fields for the ticket/refund emails, resolved from Stripe (never
 * stored by us): card brand + last4, currency, and the Stripe-hosted receipt
 * URL. Looked up from the PaymentIntent's latest charge.
 */
export async function getReceiptDetails(
  paymentIntentId: string
): Promise<ReceiptDetails> {
  const pi = await stripeCheckout.paymentIntents.retrieve(paymentIntentId, {
    expand: ['latest_charge'],
  });
  const charge = (pi.latest_charge as Stripe.Charge | null) ?? null;
  const card = charge?.payment_method_details?.card ?? null;
  const brand = card?.brand;
  return {
    cardBrand: brand ? (CARD_BRAND_LABELS[brand] ?? brand) : undefined,
    cardLast4: card?.last4 ?? undefined,
    currency: charge?.currency ? charge.currency.toUpperCase() : undefined,
    receiptUrl: charge?.receipt_url ?? undefined,
  };
}
