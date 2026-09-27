import { describe, expect, it } from 'vitest';

import { forgotPasswordSchema } from './forgot-password-schema';

describe('forgotPasswordSchema', () => {
  it('accepts a valid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'ahmedsoliman@test.com',
    });

    expect(result.success).toBe(true);
  });

  it('trims the email before validation', () => {
    const result = forgotPasswordSchema.safeParse({
      email: '  ahmedsoliman@test.com  ',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe('ahmedsoliman@test.com');
    }
  });

  it('rejects an empty email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: '',
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Enter your email address.');
    }
  });

  it('rejects an invalid email', () => {
    const result = forgotPasswordSchema.safeParse({
      email: 'ahmedsoliman',
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Enter a valid email address.');
    }
  });
});
