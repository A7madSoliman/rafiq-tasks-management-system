import { AuthenticatedUser } from '@/features/auth/types/authenticated-user';
import { mapSupabaseUser } from '@/features/auth/utils/map-supabase-user';
import { cookies } from 'next/headers';

export async function getSession() {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get('access_token')?.value ?? null;
  const refreshToken = cookieStore.get('refresh_token')?.value ?? null;
  const rememberMe = cookieStore.get('remember_me')?.value === '1';

  return {
    accessToken,
    refreshToken,
    rememberMe,
  };
}

export async function verifyAccessToken(accessToken: string): Promise<AuthenticatedUser | null> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return null;
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: supabaseSecretKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const data: unknown = await response.json().catch(() => null);

  if (typeof data !== 'object' || data === null || !('id' in data) || typeof data.id !== 'string') {
    return null;
  }

  return mapSupabaseUser(data);
}

export type AuthState =
  | {
      status: 'authenticated';
      user: AuthenticatedUser;
    }
  | {
      status: 'refreshable';
    }
  | {
      status: 'unauthenticated';
    };

export async function getAuthState(): Promise<AuthState> {
  const session = await getSession();

  if (!session.accessToken) {
    return session.refreshToken ? { status: 'refreshable' } : { status: 'unauthenticated' };
  }

  const user = await verifyAccessToken(session.accessToken);

  if (user) {
    return {
      status: 'authenticated',
      user,
    };
  }

  return session.refreshToken ? { status: 'refreshable' } : { status: 'unauthenticated' };
}
