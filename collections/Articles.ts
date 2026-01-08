import { CollectionConfig } from 'payload';

const slugify = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

export const Articles: CollectionConfig = {
  slug: 'articles',
  admin: {
    useAsTitle: 'title',
  },
  versions: {
    drafts: true,
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data.category === 'review' && data.movie && !data.slug) {
          data.slug = slugify(data.movie);
        } else if (data.category === 'editorial' && data.title && !data.slug) {
          data.slug = slugify(data.title);
        }
        return data;
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { readOnly: true },
    },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'body', type: 'richText', required: true },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Review', value: 'review' },
        { label: 'Editorial', value: 'editorial' },
      ],
      required: true,
    },
    {
      name: 'rating',
      type: 'select',
      options: [
        { label: '0', value: '0' },
        { label: '0.5', value: '0.5' },
        { label: '1', value: '1' },
        { label: '1.5', value: '1.5' },
        { label: '2', value: '2' },
        { label: '2.5', value: '2.5' },
        { label: '3', value: '3' },
        { label: '3.5', value: '3.5' },
        { label: '4', value: '4' },
        { label: '4.5', value: '4.5' },
        { label: '5', value: '5' },
      ],
      admin: {
        condition: (data) => data.category === 'review',
      },
    },
    {
      name: 'movie',
      type: 'text',
      admin: {
        condition: (data) => data.category === 'review',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      required: true,
    },
  ],
};
