import type { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    // Cap the stored original — no full-size file kept in Vercel Blob
    // Not forcing JPEG here because logos/author photos may be PNG with transparency
    resizeOptions: {
      width: 800,
      height: 1200,
      fit: 'inside',
      withoutEnlargement: true,
    },
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 600,
        position: 'center',
        formatOptions: {
          format: 'jpeg',
          options: { quality: 80 },
        },
      },
      {
        name: 'emailPoster',
        width: 200,
        height: 300,
        position: 'center',
        formatOptions: {
          format: 'jpeg',
          options: { quality: 75 },
        },
      },
    ],
  },
};
