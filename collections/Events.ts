import { CollectionConfig, CollectionSlug } from 'payload';

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'name',
  },
  versions: {
    drafts: true,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'description', type: 'richText', required: true },
    { name: 'image', type: 'upload', relationTo: 'media', required: false },
    { name: 'price', type: 'number', required: true },
    {
      name: 'location',
      type: 'relationship',
      relationTo: 'locations' as CollectionSlug,
      required: true,
    },
    {
      name: 'datetime',
      type: 'date',
      required: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'ticketUrl',
      type: 'text',
      label: 'Stripe Payment Link',
      required: false,
    },
    {
      name: 'ticketLimit',
      type: 'number',
      label: 'Number of Tickets Available',
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
  ],
};
