import type { CollectionConfig } from 'payload';

export const Locations: CollectionConfig = {
  slug: 'locations',
  admin: {
    useAsTitle: 'name',
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'address', type: 'text', required: true },
    { name: 'city', type: 'text', required: true },
    { name: 'state', type: 'text', required: true },
    { name: 'zip', type: 'number', required: true },
    { name: 'url', type: 'text', required: true },
    { name: 'logo', type: 'upload', relationTo: 'media' },
  ],
};
