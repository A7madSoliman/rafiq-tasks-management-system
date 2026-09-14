import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Enter your email address.')
    .email('Enter a valid email address.'),

  password: z.string().min(1, 'Enter your password.'),

  rememberMe: z.boolean(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
