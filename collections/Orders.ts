import type { CollectionConfig } from 'payload';

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'id',
  },
  access: {
    create: () => false,
    delete: () => false,
    read: () => true,
    update: () => false,
  },
  hooks: {
    beforeValidate: [
      async ({ data, req }) => {
        if (!data?.productId || data.item) return data;

        const eventResult = await req.payload.find({
          collection: 'events',
          where: { productId: { equals: data.productId } },
        });

        if (eventResult.docs.length > 0) {
          const event = eventResult.docs[0];
          data.item = {
            relationTo: 'events',
            value: event.id,
          };
          return data;
        }

        const merchResult = await req.payload.find({
          collection: 'merch',
          where: { productId: { equals: data.productId } },
        });

        if (merchResult.docs.length > 0) {
          const merch = merchResult.docs[0];
          data.item = {
            relationTo: 'merch',
            value: merch.id,
          };
        }

        return data;
      },
    ],
  },
  fields: [
    {
      // Legacy: set by the old Checkout Session flow. Kept (optional, unique)
      // for historical orders; new orders use `paymentIntentId` instead.
      name: 'checkoutSessionId',
      type: 'text',
      required: false,
      admin: { readOnly: true },
      unique: true,
    },
    {
      name: 'paymentIntentId',
      type: 'text',
      required: false,
      admin: { readOnly: true },
      unique: true,
    },
    {
      // Set by the ticket-email task once Resend accepts the send. Doubles as
      // the delivery-idempotency guard: the task skips if this is already set,
      // so QStash's at-least-once delivery can't send a duplicate email.
      name: 'ticketEmailSentAt',
      type: 'date',
      required: false,
      admin: { readOnly: true },
    },
    {
      // Set when the order is refunded.
      name: 'refundedAt',
      type: 'date',
      required: false,
      admin: { readOnly: true },
    },
    {
      // Idempotency guard for the refund-confirmation email.
      name: 'refundEmailSentAt',
      type: 'date',
      required: false,
      admin: { readOnly: true },
    },
    {
      name: 'productId',
      type: 'text',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'customerId',
      type: 'text',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'amountPaid',
      type: 'number',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'quantity',
      type: 'number',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'transactionDate',
      type: 'date',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'receiptUrl',
      type: 'text',
      required: true,
      unique: true,
      admin: { readOnly: true },
    },
    {
      name: 'item',
      type: 'relationship',
      relationTo: ['events', 'merch'],
      required: true,
      admin: { readOnly: true },
    },
  ],
};
