import type { CollectionConfig } from 'payload';

export const Purchases: CollectionConfig = {
  slug: 'purchases',
  admin: {
    useAsTitle: 'id',
  },
  fields: [
    { name: 'customerId', type: 'text', admin: { readOnly: true } },
    { name: 'amountPaid', type: 'number', admin: { readOnly: true } },
    { name: 'currency', type: 'text', admin: { readOnly: true } },
    { name: 'createdAt', type: 'text', admin: { readOnly: true } },
    {
      name: 'item',
      type: 'relationship',
      relationTo: ['events', 'merch'],
      required: true,
    },
  ],
};
