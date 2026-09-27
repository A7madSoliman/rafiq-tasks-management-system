import { describe, expect, it } from 'vitest';
import { resetPasswordSchema } from './reset-password-schema';

describe('resetPasswordSchema', () => {
  it('accepts a valid password and matching confirmation', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'StrongPass1!',
      confirmPassword: 'StrongPass1!',
    });

    expect(result.success).toBe(true);
  });

  it('rejects a password shorter than 8 characters', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Aa1!',
      confirmPassword: 'Aa1!',
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.message === 'Password must be at least 8 characters.',
        ),
      ).toBe(true);
    }
  });

  it('rejects a password without an uppercase letter', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'strongpass1!',
      confirmPassword: 'strongpass1!',
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.message === 'Password must contain an uppercase letter.',
        ),
      ).toBe(true);
    }
  });

  it('rejects a password without a special character', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'StrongPass1',
      confirmPassword: 'StrongPass1',
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.message === 'Password must contain a special character.',
        ),
      ).toBe(true);
    }
  });

  it('rejects passwords that do not match', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'StrongPass1!',
      confirmPassword: 'DifferentPass1!',
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === 'Passwords do not match.')).toBe(
        true,
      );
    }
  });
});
