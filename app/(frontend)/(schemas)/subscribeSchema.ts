import { z } from 'zod';

const subscribeSchema = z.object({
  email: z.string().email(),
  // Where the signup came from, e.g. "qr" from the /join short link's
  // utm_source. Short slug only, since it's stored on the Resend contact.
  source: z
    .string()
    .trim()
    .max(50)
    .regex(/^[a-z0-9_-]+$/i)
    .optional(),
});

export default subscribeSchema;
