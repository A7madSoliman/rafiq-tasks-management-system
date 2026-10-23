import { describe, expect, it } from 'vitest';

import { getAuthPageHref, getSafeInvitationReturnPath } from './invitation-return-path';

describe('getSafeInvitationReturnPath', () => {
  it('accepts a local invitation URL', () => {
    expect(getSafeInvitationReturnPath('/invite?token=abc123')).toBe('/invite?token=abc123');
  });

  it('preserves encoded invitation parameters', () => {
    const returnPath = '/invite?token=abc%2F123&source=email';

    expect(getSafeInvitationReturnPath(returnPath)).toBe(returnPath);
  });

  it.each([
    null,
    undefined,
    '',
    123,
    ['invite'],
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    '/project',
    '/invite/other',
    '/invite#fragment',
    '/invite\n?token=abc',
  ])('rejects an unsafe return path: %j', (value) => {
    expect(getSafeInvitationReturnPath(value)).toBeNull();
  });

  it('rejects excessively long return paths', () => {
    expect(getSafeInvitationReturnPath(`/invite?token=${'a'.repeat(2100)}`)).toBeNull();
  });
});

describe('getAuthPageHref', () => {
  it('uses ordinary auth URLs without invitations', () => {
    expect(getAuthPageHref('/login', null)).toBe('/login');

    expect(getAuthPageHref('/sign-up', null)).toBe('/sign-up');
  });

  it('preserves invitations through Sign Up and Login', () => {
    const returnPath = '/invite?token=abc123';

    const signupHref = getAuthPageHref('/sign-up', returnPath);

    const signupUrl = new URL(signupHref, 'http://localhost:3000');

    expect(signupUrl.pathname).toBe('/sign-up');
    expect(signupUrl.searchParams.get('next')).toBe(returnPath);

    const loginHref = getAuthPageHref('/login', returnPath);

    const loginUrl = new URL(loginHref, 'http://localhost:3000');

    expect(loginUrl.pathname).toBe('/login');
    expect(loginUrl.searchParams.get('next')).toBe(returnPath);
  });
});
