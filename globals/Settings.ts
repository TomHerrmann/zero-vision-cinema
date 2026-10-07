import type { CollectionSlug, Field, GlobalConfig } from 'payload';
import {
  EVENT_TYPE_NAMES,
  defaultVenueField,
  type EventType,
} from '@/utils/eventTypes';

const defaultVenueFields: Field[] = (
  Object.entries(EVENT_TYPE_NAMES) as [EventType, string][]
).map(([eventType, label]) => ({
  name: defaultVenueField(eventType),
  type: 'relationship',
  relationTo: 'locations' as CollectionSlug,
  label,
}));

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
    {
      // Presentational only: the fields stay top-level in the data.
      type: 'collapsible',
      label: 'Default venues',
      admin: {
        description:
          'The venue a new event starts with when its type is picked. You can still change it per event.',
      },
      fields: defaultVenueFields,
    },
  ],
};
