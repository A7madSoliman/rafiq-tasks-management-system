'use client';

import { AuthenticatedUser } from '@/features/auth/types/authenticated-user';
import { ReactNode, useState } from 'react';
import { DesktopSidebar } from './desktop-sidebar';
import { Navbar } from './navbar';
import { MobileDrawer } from './mobile-drawer';

type AuthenticatedShellProps = {
  children: ReactNode;
  user: AuthenticatedUser | null;
};

export function AuthenticatedShell({ children, user }: AuthenticatedShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <DesktopSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar user={user} onOpenMobileMenu={() => setIsMobileDrawerOpen(true)} />
        <MobileDrawer isOpen={isMobileDrawerOpen} onClose={() => setIsMobileDrawerOpen(false)} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
