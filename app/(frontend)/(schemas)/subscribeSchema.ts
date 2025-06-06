import { z } from 'zod';

const subscribeSchema = z.object({
  email: z.string().email(),
});

export default subscribeSchema;
