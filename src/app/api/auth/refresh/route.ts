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
      apikey: supabaseSecretKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refresh_token: refreshToken,
    }),
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    cookieStore.delete('access_token');
    cookieStore.delete('refresh_token');
    cookieStore.delete('remember_me');

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

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };

  cookieStore.set('access_token', data.access_token, {
    ...cookieOptions,
  });

  cookieStore.set('refresh_token', data.refresh_token, {
    ...cookieOptions,
    ...(rememberMe
      ? {
          maxAge: 60 * 60 * 24 * 30,
        }
      : {}),
  });

  cookieStore.set('remember_me', rememberMe ? '1' : '0', {
    ...cookieOptions,
    ...(rememberMe
      ? {
          maxAge: 60 * 60 * 24 * 30,
        }
      : {}),
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
