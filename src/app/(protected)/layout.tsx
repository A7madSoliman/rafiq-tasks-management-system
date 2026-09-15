import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { AuthenticatedShell } from '@/components/shared/authenticated-layout/authenticated-shell';
import { SessionRestore } from '@/components/shared/authenticated-layout/session-restore';
import { getAuthState } from '@/lib/auth/session';

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const authState = await getAuthState();

  if (authState.status === 'unauthenticated') {
    redirect('/login');
  }

  if (authState.status === 'refreshable') {
    return <SessionRestore />;
  }

  return <AuthenticatedShell user={authState.user}>{children}</AuthenticatedShell>;
}
