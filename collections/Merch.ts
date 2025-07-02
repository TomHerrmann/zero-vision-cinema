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
      unique: true,
      admin: {
        readOnly: true,
        condition: (data) => Boolean(data.paymentLink),
        description:
          'This id is automatically generated when the event is published',
      },
    },
    {
      name: 'merchLimit',
      type: 'number',
      label: 'Number of Items Available',
      admin: {
        condition: (data) => Boolean(data.price),
        description:
          'Maximum number of tickets that can be sold for this event',
      },
      validate: (
        value: number | null | undefined,
        { data }: { data: { price?: number } }
      ) => {
        if (data.price && (value === null || value === undefined)) {
          return 'Ticket limit is required for paid events';
        }
        return true;
      },
    },
    {
      name: 'merchSold',
      type: 'number',
      defaultValue: 0,
      admin: { readOnly: true },
    },
  ],
};
