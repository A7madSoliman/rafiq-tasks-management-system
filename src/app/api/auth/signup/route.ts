import { signupSchema } from '@/features/auth/schemas/signup-schema';
import { SignupErrorResponse, SignupSuccessResponse } from '@/features/auth/types/signup-api';
import { NextResponse } from 'next/server';

type SupabaseSignupPayload = {
  email: string;
  password: string;
  data: {
    name: string;
    department: string;
  };
};

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const result = signupSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      {
        message: 'Invalid signup data.',
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
      {
        status: 500,
      },
    );
  }

  const { name, email, jobTitle, password } = result.data;

  const payload: SupabaseSignupPayload = {
    email,
    password,
    data: {
      name,
      department: jobTitle,
    },
  };

  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseSecretKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData: unknown = await response.json().catch(() => null);

    const isDuplicateEmail =
      typeof errorData === 'object' &&
      errorData !== null &&
      'error_code' in errorData &&
      errorData.error_code === 'user_already_exists';

    const errorResponse: SignupErrorResponse = {
      message: isDuplicateEmail
        ? 'An account with this email already exists.'
        : 'Unable to create account.',
    };

    return NextResponse.json(errorResponse, {
      status: isDuplicateEmail ? 409 : response.status,
    });
  }

  const successResponse: SignupSuccessResponse = {
    message: 'Account created successfully.',
  };

  return NextResponse.json(successResponse, {
    status: 201,
  });
}
