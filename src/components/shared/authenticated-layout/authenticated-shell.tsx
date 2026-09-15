'use client';

import { AuthenticatedUser } from '@/features/auth/types/authenticated-user';
import { ReactNode, useState } from 'react';
import { DesktopSidebar } from './desktop-sidebar';
import { Navbar } from './navbar';
import { MobileDrawer } from './mobile-drawer';
import { MobileBottomNavigation } from './mobile-bottom-navigation';
import { useLogout } from '@/features/auth/hooks/use-logout';

type AuthenticatedShellProps = {
  children: ReactNode;
  user: AuthenticatedUser | null;
};

export function AuthenticatedShell({ children, user }: AuthenticatedShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const { logout, isLoggingOut } = useLogout();

  return (
    <div className="flex min-h-dvh">
      <DesktopSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((current) => !current)}
        onLogout={logout}
        isLoggingOut={isLoggingOut}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar user={user} onOpenMobileMenu={() => setIsMobileDrawerOpen(true)} />
        <MobileDrawer
          onLogout={logout}
          isLoggingOut={isLoggingOut}
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
        />
        <main className="min-w-0 flex-1 pb-16 lg:pb-0">{children}</main>
        <MobileBottomNavigation />
      </div>
    </div>
  );
}
