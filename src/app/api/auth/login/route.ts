import { loginSchema } from '@/features/auth/schemas/login-schema';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type SupabaseLoginPayload = {
  email: string;
  password: string;
};

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);

  const result = loginSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        message: 'Invalid login data.',
        fieldErrors: result.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return NextResponse.json(
      {
        message: 'Server configuration error.',
      },
      { status: 500 },
    );
  }

  const { email, password, rememberMe } = result.data;

  const payload: SupabaseLoginPayload = {
    email,
    password,
  };

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseSecretKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => null);

    const isInvalidCredentials =
      typeof errorData === 'object' &&
      errorData !== null &&
      'error_code' in errorData &&
      errorData.error_code === 'invalid_credentials';

    return NextResponse.json(
      {
        message: isInvalidCredentials ? 'Invalid email or password.' : 'Unable to log in.',
      },
      {
        status: isInvalidCredentials ? 401 : response.status,
      },
    );
  }

  const data: unknown = await response.json().catch(() => null);
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

  const cookieStore = await cookies();
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
      message: 'Logged in successfully.',
    },
    {
      status: 200,
    },
  );
}
