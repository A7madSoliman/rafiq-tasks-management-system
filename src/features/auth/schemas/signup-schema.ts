import { z } from 'zod';

import { passwordRules } from '../validation/password-rules';

const nameRegex = /^[\p{L}\s]+$/u;

export const signupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Enter your full name.')
      .min(3, 'Name must be at least 3 characters.')
      .max(50, 'Name must be at most 50 characters.')
      .regex(nameRegex, 'Name must contain letters only.'),

    email: z
      .string()
      .trim()
      .min(1, 'Enter your email address.')
      .email('Enter a valid email address.'),

    jobTitle: z.string(),

    password: z
      .string()
      .min(1, 'Enter your password.')
      .min(passwordRules.minLength, 'Password must be at least 8 characters.')
      .regex(passwordRules.uppercase, 'Password must contain an uppercase letter.')
      .regex(passwordRules.lowercase, 'Password must contain a lowercase letter.')
      .regex(passwordRules.digit, 'Password must contain a number.')
      .regex(passwordRules.specialCharacter, 'Password must contain a special character.'),

    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;
