import { z } from 'zod';

export const recoveryBootstrapSchema = z.object({
  accessToken: z.string().min(1),
  type: z.literal('recovery'),
});
