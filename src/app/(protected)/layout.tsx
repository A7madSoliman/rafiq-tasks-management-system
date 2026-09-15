import { AuthenticatedShell } from '@/components/ui/shared/authenticated-layout/authenticated-shell';
import type { ReactNode } from 'react';

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}
