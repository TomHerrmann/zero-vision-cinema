import { z } from 'zod';

export const CONTACT_INBOXES = ['info', 'press'] as const;
export type ContactInbox = (typeof CONTACT_INBOXES)[number];

const contactEmailSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  message: z.string().trim(),
  inbox: z.enum(CONTACT_INBOXES).optional(),
});

export default contactEmailSchema;
