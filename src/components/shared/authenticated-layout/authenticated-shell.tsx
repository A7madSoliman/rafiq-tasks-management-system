'use client';

import { Navbar } from '@/components/shared/authenticated-layout/navbar';
import { AuthenticatedUser } from '@/features/auth/types/authenticated-user';
import { ReactNode, useState } from 'react';
import { DesktopSidebar } from './desktop-sidebar';

type AuthenticatedShellProps = {
  children: ReactNode;
  user: AuthenticatedUser | null;
};

export function AuthenticatedShell({ children, user }: AuthenticatedShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <DesktopSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar user={user} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
