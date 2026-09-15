'use client';

import { AuthenticatedUser } from '@/features/auth/types/authenticated-user';
import { ReactNode, useState } from 'react';
import { Navbar } from './navbar';

type AuthenticatedShellProps = {
  children: ReactNode;
  user: AuthenticatedUser | null;
};

export function AuthenticatedShell({ children, user }: AuthenticatedShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-dvh">
      <aside
        className={`hidden shrink-0 transition-[width] duration-300 ease-in-out lg:flex lg:flex-col ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <button
          type="button"
          className="mt-auto"
          onClick={() => setIsSidebarCollapsed((cur) => !cur)}
        >
          {isSidebarCollapsed ? ' Expand' : 'Collapse'}
        </button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="h-16 shrink-0">
          <Navbar user={user} />
        </header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
