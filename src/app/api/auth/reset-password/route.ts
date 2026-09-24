import { resetPasswordSchema } from '@/features/auth/schemas/reset-password-schema';
import { clearRecoveryCookie, getRecoveryToken } from '@/lib/auth/recovery-cookie';
import { verifyAccessToken } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);

  const result = resetPasswordSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        message: 'Invalid password.',
        fieldErrors: result.error.flatten().fieldErrors,
      },
      {
        status: 400,
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

  const recoveryToken = await getRecoveryToken();

  if (!recoveryToken) {
    return NextResponse.json(
      {
        message: 'Invalid or expired reset link.',
      },
      {
        status: 401,
      },
    );
  }

  const user = await verifyAccessToken(recoveryToken);

  if (!user) {
    await clearRecoveryCookie();

    return NextResponse.json(
      {
        message: 'Invalid or expired reset link.',
      },
      {
        status: 401,
      },
    );
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseSecretKey,
      Authorization: `Bearer ${recoveryToken}`,
    },
    body: JSON.stringify({
      password: result.data.password,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    if (response.status === 401) {
      await clearRecoveryCookie();

      return NextResponse.json(
        {
          message: 'Invalid or expired reset link.',
        },
        {
          status: 401,
        },
      );
    }

    return NextResponse.json(
      {
        message: 'Unable to update password. Please try again.',
      },
      {
        status: response.status,
      },
    );
  }

  await clearRecoveryCookie();

  return NextResponse.json(
    {
      message: 'Password updated successfully.',
    },
    {
      status: 200,
    },
  );
}
