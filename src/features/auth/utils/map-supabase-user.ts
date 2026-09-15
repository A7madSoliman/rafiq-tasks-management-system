import type { AuthenticatedUser } from '../types/authenticated-user';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function mapSupabaseUser(data: unknown): AuthenticatedUser | null {
  if (!isRecord(data) || typeof data.id !== 'string') {
    return null;
  }

  const metadata = isRecord(data.user_metadata) ? data.user_metadata : null;

  return {
    id: data.id,
    email: typeof data.email === 'string' ? data.email : null,
    name: metadata && typeof metadata.name === 'string' ? metadata.name : null,
    jobTitle: metadata && typeof metadata.department === 'string' ? metadata.department : null,
  };
}
