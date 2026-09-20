import { cookies } from 'next/headers';

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

type SetAuthCookiesParams = {
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
};

export async function setAuthCookies({
  accessToken,
  refreshToken,
  rememberMe,
}: SetAuthCookiesParams) {
  const cookieStore = await cookies();
  // Intentionally keep the access token as a session cookie.
  // Supabase enforces the JWT expiration, and our session restore flow
  // uses the refresh token when the access token is no longer valid.
  cookieStore.set('access_token', accessToken, {
    ...authCookieOptions,
  });

  cookieStore.set('refresh_token', refreshToken, {
    ...authCookieOptions,
    ...(rememberMe
      ? {
          maxAge: THIRTY_DAYS_IN_SECONDS,
        }
      : {}),
  });

  cookieStore.set('remember_me', rememberMe ? '1' : '0', {
    ...authCookieOptions,
    ...(rememberMe
      ? {
          maxAge: THIRTY_DAYS_IN_SECONDS,
        }
      : {}),
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();

  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
  cookieStore.delete('remember_me');
}
