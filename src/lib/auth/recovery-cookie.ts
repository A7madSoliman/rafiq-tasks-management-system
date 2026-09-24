import { cookies } from 'next/headers';

const TEN_MINUTES_IN_SECONDS = 60 * 10;

const RECOVERY_COOKIE_NAME = 'password_recovery_token';

const recoveryCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/api/auth/reset-password',
};

export async function setRecoveryCookie(accessToken: string) {
  const cookieStore = await cookies();

  cookieStore.set(RECOVERY_COOKIE_NAME, accessToken, {
    ...recoveryCookieOptions,
    maxAge: TEN_MINUTES_IN_SECONDS,
  });
}

export async function getRecoveryToken() {
  const cookieStore = await cookies();

  return cookieStore.get(RECOVERY_COOKIE_NAME)?.value ?? null;
}

export async function clearRecoveryCookie() {
  const cookieStore = await cookies();

  cookieStore.delete({
    name: RECOVERY_COOKIE_NAME,
    path: recoveryCookieOptions.path,
  });
}
