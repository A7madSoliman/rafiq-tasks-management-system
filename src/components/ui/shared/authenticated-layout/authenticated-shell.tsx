'use client';

import { ReactNode, useState } from 'react';

type AuthenticatedShellProps = {
  children: ReactNode;
};

export function AuthenticatedShell({ children }: AuthenticatedShellProps) {
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
        <header className="h-16 shrink-0">Navbar</header>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
