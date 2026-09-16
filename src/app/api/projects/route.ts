import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return NextResponse.json({ message: 'No active session' }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return NextResponse.json({ message: ' Server configuration error' }, { status: 500 });
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_projects`, {
    method: 'GET',
    headers: {
      apikey: supabaseSecretKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json({ message: 'Unable to load projects.' }, { status: response.status });
  }

  return NextResponse.json(data, {
    status: 200,
  });
}
