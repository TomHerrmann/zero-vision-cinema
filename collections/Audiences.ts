import { beforeAudienceValidateHook } from '@/app/(payload)/hooks/beforeAudienceValidateHook';
import type { CollectionConfig, PayloadRequest } from 'payload';

export const Audiences: CollectionConfig = {
  slug: 'audiences',
  admin: {
    useAsTitle: 'name',
  },
  hooks: {
    beforeValidate: [beforeAudienceValidateHook],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'resendId',
      type: 'text',
      required: true,
      admin: {
        hidden: true,
      },
    },
  ],
};
