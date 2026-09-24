import { forgotPasswordSchema } from '@/features/auth/schemas/forgot-password-schema';
import { NextResponse } from 'next/server';

type SupabaseRecoverPayload = {
  email: string;
};

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);

  const result = forgotPasswordSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        message: 'Invalid email address.',
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

  const redirectTo = new URL('/reset-password', request.url).toString();

  const payload: SupabaseRecoverPayload = {
    email: result.data.email,
  };

  const response = await fetch(
    `${supabaseUrl}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseSecretKey,
      },
      body: JSON.stringify(payload),
    },
  );

  if (!response.ok) {
    return NextResponse.json(
      {
        message: 'Unable to send reset link. Please try again.',
      },
      { status: response.status },
    );
  }

  return NextResponse.json(
    {
      message: 'If an account exists with this email, we’ve sent a password reset link.',
    },
    { status: 200 },
  );
}
