import type { CollectionConfig } from 'payload';

export const Purchases: CollectionConfig = {
  slug: 'purchases',
  admin: {
    useAsTitle: 'id',
  },
  fields: [
    { name: 'productId', type: 'text', required: true },
    { name: 'price', type: 'number', required: true },
    { name: 'amountPaid', type: 'number', required: true },
    { name: 'quantity', type: 'number', required: true },
    { name: 'status', type: 'text', required: true },
    { name: 'customerId', type: 'text', required: true },
    { name: 'transactionDate', type: 'date', required: true },
    { name: 'receiptUrl', type: 'text', required: true },
    {
      name: 'item',
      type: 'relationship',
      relationTo: ['events', 'merch'],
      required: true,
    },
  ],
};
