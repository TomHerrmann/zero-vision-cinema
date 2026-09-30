import type { CollectionConfig } from 'payload';
import {
  BoldFeature,
  HeadingFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnderlineFeature,
  UnorderedListFeature,
  FixedToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical';
import {
  BROADCAST_SEGMENTS,
  cancelCustomBroadcast,
  syncCustomBroadcast,
} from '@/lib/customBroadcasts';

/**
 * Hand-written email broadcasts to the whole audience segment.
 *
 * Saving an entry as "Scheduled" hands it to Resend, which sends it at
 * `sendAt` — see `lib/customBroadcasts.ts`. Drafts never leave Payload.
 */
export const CustomBroadcasts: CollectionConfig = {
  slug: 'custom-broadcasts',
  labels: { singular: 'Email Broadcast', plural: 'Email Broadcasts' },
  admin: {
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'status', 'sendAt', 'updatedAt'],
    description:
      'One-off emails to the whole mailing list. Nothing is sent while an entry is a Draft.',
  },
  // A duplicate would copy "Scheduled" and a live send time along with it.
  disableDuplicate: true,
  hooks: {
    beforeChange: [syncCustomBroadcast],
    afterDelete: [cancelCustomBroadcast],
  },
  fields: [
    { name: 'subject', type: 'text', required: true },
    {
      name: 'heading',
      type: 'text',
      admin: {
        description:
          'Headline at the top of the email. Leave blank to use the subject.',
      },
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      // WebP, AVIF and SVG don't render in Outlook (and SVG not in Gmail).
      filterOptions: {
        mimeType: { in: ['image/jpeg', 'image/png', 'image/gif'] },
      },
      admin: {
        description:
          'Shown stacked, in this order, between the headline and the body. Any size or shape works — each is scaled to fit and never cropped. JPG, PNG or GIF only.',
      },
    },
    {
      name: 'body',
      type: 'richText',
      required: true,
      // Only what survives email clients: no uploads, embeds, checklists,
      // indents or alignment. Links are external URLs only — an internal
      // document link has no address inside an inbox.
      editor: lexicalEditor({
        features: [
          ParagraphFeature(),
          HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
          BoldFeature(),
          ItalicFeature(),
          UnderlineFeature(),
          UnorderedListFeature(),
          OrderedListFeature(),
          LinkFeature({ enabledCollections: [] }),
          FixedToolbarFeature(),
          InlineToolbarFeature(),
        ],
      }),
    },
    {
      name: 'cta',
      label: 'Call to action',
      type: 'group',
      fields: [
        {
          name: 'enabled',
          label: 'Show a button',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'label',
          label: 'Button text',
          type: 'text',
          admin: { condition: (_, siblingData) => Boolean(siblingData?.enabled) },
          validate: (
            value: string | null | undefined,
            { siblingData }: { siblingData: unknown }
          ) =>
            (siblingData as { enabled?: boolean })?.enabled && !value?.trim()
              ? 'Button text is required when the button is on.'
              : true,
        },
        {
          name: 'url',
          label: 'Button link',
          type: 'text',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
            placeholder: 'https://',
          },
          validate: (
            value: string | null | undefined,
            { siblingData }: { siblingData: unknown }
          ) => {
            if (!(siblingData as { enabled?: boolean })?.enabled) return true;
            if (!value?.trim()) {
              return 'Button link is required when the button is on.';
            }
            return /^https?:\/\/\S+$/i.test(value.trim())
              ? true
              : 'Enter a full link starting with https://';
          },
        },
      ],
    },
    {
      name: 'segment',
      type: 'select',
      // Required with no default, so the audience is always a deliberate choice.
      required: true,
      options: Object.entries(BROADCAST_SEGMENTS).map(([value, { label }]) => ({
        label,
        value,
      })),
      admin: {
        position: 'sidebar',
        description:
          'Who receives it. The Test segment can be scheduled from any environment, and its subject is prefixed [TEST].',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Scheduled', value: 'scheduled' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Saving as Scheduled queues the email in Resend for the send time below. Switch back to Draft to cancel.',
      },
    },
    {
      name: 'sendAt',
      label: 'Send at',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime', timeIntervals: 15 },
        description:
          "In your browser's timezone. Must be at least 10 minutes out. The entry locks 5 minutes before it sends.",
      },
      validate: (
        value: Date | string | null | undefined,
        { siblingData }: { siblingData: unknown }
      ) =>
        (siblingData as { status?: string })?.status === 'scheduled' && !value
          ? 'A send time is required to schedule.'
          : true,
    },
    {
      name: 'sendTestTo',
      label: 'Send test to',
      type: 'email',
      virtual: true,
      admin: {
        position: 'sidebar',
        description:
          'Optional. On save, emails this entry to just this address (works on drafts). Not stored. The unsubscribe link only works in the real send.',
      },
    },
    {
      name: 'resendBroadcastId',
      label: 'Resend broadcast ID',
      type: 'text',
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
};
