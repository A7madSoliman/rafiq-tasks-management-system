import { describe, expect, it } from 'vitest';

import { inviteMemberSchema } from './invite-member-schema';

describe('inviteMemberSchema', () => {
  it('accepts a valid email', () => {
    const result = inviteMemberSchema.safeParse({
      email: 'user@example.com',
    });

    expect(result.success).toBe(true);
  });

  it('trims whitespace', () => {
    const result = inviteMemberSchema.safeParse({
      email: '  user@example.com  ',
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(result.data.email).toBe('user@example.com');
    }
  });

  it('rejects empty email', () => {
    expect(
      inviteMemberSchema.safeParse({
        email: '',
      }).success,
    ).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(
      inviteMemberSchema.safeParse({
        email: 'invalid-email',
      }).success,
    ).toBe(false);
  });
});
