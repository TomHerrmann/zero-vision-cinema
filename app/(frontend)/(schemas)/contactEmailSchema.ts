import { z } from 'zod';

const contactEmailSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  message: z.string().trim(),
});

export default contactEmailSchema;
