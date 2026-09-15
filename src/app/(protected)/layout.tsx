import { AuthenticatedShell } from '@/components/shared/authenticated-layout/authenticated-shell';
import { getAuthState } from '@/lib/auth/session';
import type { ReactNode } from 'react';

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const authState = await getAuthState();
  const user = authState.status === 'authenticated' ? authState.user : null;

  return <AuthenticatedShell user={user}>{children}</AuthenticatedShell>;
}
