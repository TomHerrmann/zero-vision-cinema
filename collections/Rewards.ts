import type { CollectionConfig } from 'payload';

/**
 * Loyalty rewards: a single-use code for one free ticket, earned by making
 * `REWARD_PURCHASES` paid ticket purchases within `WINDOW_DAYS` (see
 * lib/loyalty). Tied to the Stripe customer id only — no email or other PII is
 * stored; the address is resolved from Stripe at send time.
 */
export const Rewards: CollectionConfig = {
  slug: 'rewards',
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'issuedAt', 'expiresAt', 'redeemedAt', 'voidedAt'],
  },
  access: {
    create: () => false,
    delete: () => false,
    read: ({ req }) => Boolean(req.user),
    update: () => false,
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      admin: { readOnly: true },
    },
    {
      name: 'customerId',
      type: 'text',
      required: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'issuedAt',
      type: 'date',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'expiresAt',
      type: 'date',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'redeemedAt',
      type: 'date',
      required: false,
      admin: { readOnly: true },
    },
    {
      // The free-ticket order this reward paid for.
      name: 'redeemedOrder',
      type: 'relationship',
      relationTo: 'orders',
      required: false,
      admin: { readOnly: true },
    },
    {
      // Set when a refund breaks the purchases that earned it.
      name: 'voidedAt',
      type: 'date',
      required: false,
      admin: { readOnly: true },
    },
    {
      name: 'voidReason',
      type: 'text',
      required: false,
      admin: { readOnly: true },
    },
    {
      // Idempotency guard for the reward email.
      name: 'rewardEmailSentAt',
      type: 'date',
      required: false,
      admin: { readOnly: true },
    },
  ],
};
