import { recoveryBootstrapSchema } from '@/features/auth/schemas/recovery-bootstrap-schema';
import {
  clearRecoveryCookie,
  getRecoveryToken,
  setRecoveryCookie,
} from '@/lib/auth/recovery-cookie';
import { verifyAccessToken } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);

  const result = recoveryBootstrapSchema.safeParse(body);

  if (!result.success) {
    await clearRecoveryCookie();

    return NextResponse.json(
      {
        message: 'Invalid or expired reset link.',
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

  const user = await verifyAccessToken(result.data.accessToken);

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

  await setRecoveryCookie(result.data.accessToken);

  return NextResponse.json(
    {
      message: 'Recovery session ready.',
    },
    {
      status: 200,
    },
  );
}

export async function GET() {
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

  return NextResponse.json(
    {
      message: 'Recovery session ready.',
    },
    {
      status: 200,
    },
  );
}
