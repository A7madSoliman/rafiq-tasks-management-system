import { clearAuthCookies } from '@/lib/auth/auth-cookies';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (accessToken && supabaseUrl && supabaseSecretKey) {
    try {
      await fetch(`${supabaseUrl}/auth/v1/logout`, {
        method: 'POST',
        headers: {
          apikey: supabaseSecretKey,
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      // Local logout must still complete if remote logout fails.
    }
  }

  await clearAuthCookies();

  return new NextResponse(null, {
    status: 204,
  });
}
