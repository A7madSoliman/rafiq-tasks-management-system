import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
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

  const response = await fetch(`${supabaseUrl}/auth/v1/logout`, {
    method: 'POST',
    headers: {
      apikey: supabaseSecretKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      {
        message: 'Logout failed, please try again.',
      },
      {
        status: response.status,
      },
    );
  }

  cookieStore.delete('access_token');
  cookieStore.delete('refresh_token');
  cookieStore.delete('remember_me');

  return new NextResponse(null, {
    status: 204,
  });
}
