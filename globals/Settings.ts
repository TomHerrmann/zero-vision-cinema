import type { GlobalConfig } from 'payload';

/**
 * Site-wide settings editable in the admin. Holds values that change over time
 * (like the ticket price) so they never have to be hardcoded.
 */
export const Settings: GlobalConfig = {
  slug: 'settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      // Pre-fills the price on new ZVC events. Existing events keep their own
      // price; change those per event.
      name: 'defaultTicketPrice',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description:
          'Default price (USD) for new ZVC events. Existing events are not changed.',
      },
    },
  ],
};
