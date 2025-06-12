import type { CollectionConfig } from 'payload';

export const Merch: CollectionConfig = {
  slug: 'merch',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    { name: 'name', type: 'text' },
    {
      name: 'productId',
      type: 'text',
      label: 'Stripe Product ID',
      required: false,
      admin: {
        readOnly: true,
        condition: (data) => Boolean(data.paymentLink),
        description:
          'This id is automatically generated when the event is published',
      },
    },
  ],
};
