import { CollectionConfig } from 'payload';

export const Emails: CollectionConfig = {
  slug: 'emails',
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'event', 'status', 'createdAt'],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'subject',
      type: 'text',
      required: true,
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: false,
      admin: {
        description: 'Optionally link this campaign to an event.',
      },
    },
    {
      name: 'previewText',
      type: 'text',
      label: 'Email Preview Text',
      required: false,
      admin: {
        description:
          'Shown in inboxes after the subject. Keep it concise (35–90 characters).',
      },
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
      admin: {
        description:
          'You can reference fields from the selected event using variables like {{event.name}}, {{event.paymentLink}}, etc.',
      },
    },
    {
      name: 'scheduledAt',
      type: 'date',
      required: false,
      admin: {
        condition: (data) => data?.status === 'scheduled',
        description:
          'Set the date/time for automatic sending. You’ll need a cron or webhook to trigger this.',
      },
    },
    {
      name: 'sentAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Timestamp of when this email was actually sent.',
      },
    },
    {
      name: 'resendId',
      type: 'text',
      hidden: true,
    },
    {
      name: 'audience',
      type: 'relationship',
      relationTo: 'audiences',
      required: true,
    },
  ],
};
