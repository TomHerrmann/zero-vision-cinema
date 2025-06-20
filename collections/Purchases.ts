import type { CollectionConfig } from 'payload';

export const Purchases: CollectionConfig = {
  slug: 'purchases',
  admin: {
    useAsTitle: 'id',
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
      name: 'checkoutSessionId',
      type: 'text',
      required: true,
      admin: { readOnly: true },
      unique: true,
    },
    {
      name: 'productId',
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
