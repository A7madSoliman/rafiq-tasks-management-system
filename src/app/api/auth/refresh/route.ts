import { clearAuthCookies, setAuthCookies } from '@/lib/auth/auth-cookies';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();

  const refreshToken = cookieStore.get('refresh_token')?.value;
  const rememberMe = cookieStore.get('remember_me')?.value === '1';

  if (!refreshToken) {
    return NextResponse.json(
      {
        message: 'No active session.',
      },
      {
        status: 401,
      },
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return NextResponse.json(
      {
        message: 'Server configuration error.',
      },
      {
        status: 500,
      },
    );
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseSecretKey,
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    await clearAuthCookies();

    return NextResponse.json(
      {
        message: 'Session expired. Please log in again.',
      },
      {
        status: 401,
      },
    );
  }

  if (
    typeof data !== 'object' ||
    data === null ||
    !('access_token' in data) ||
    !('refresh_token' in data) ||
    typeof data.access_token !== 'string' ||
    typeof data.refresh_token !== 'string'
  ) {
    return NextResponse.json(
      {
        message: 'Invalid authentication response.',
      },
      {
        status: 502,
      },
    );
  }

  await setAuthCookies({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    rememberMe,
  });

  return NextResponse.json(
    {
      message: 'Session refreshed successfully.',
    },
    {
      status: 200,
    },
  );
}
