import { z } from 'zod';

import { passwordRules } from '../validation/password-rules';

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(1, 'Enter your new password.')
      .min(passwordRules.minLength, 'Password must be at least 8 characters.')
      .max(passwordRules.maxLength, 'Password must be at most 64 characters.')
      .regex(passwordRules.uppercase, 'Password must contain an uppercase letter.')
      .regex(passwordRules.lowercase, 'Password must contain a lowercase letter.')
      .regex(passwordRules.digit, 'Password must contain a number.')
      .regex(passwordRules.specialCharacter, 'Password must contain a special character.'),

    confirmPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
