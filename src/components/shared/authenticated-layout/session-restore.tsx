'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function SessionRestore() {
  const router = useRouter();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    async function restoreSession() {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
        });

        if (!response.ok) {
          router.replace('/login');
          router.refresh();
          return;
        }

        router.refresh();
      } catch {
        router.replace('/login');
        router.refresh();
      }
    }

    void restoreSession();
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-foreground-secondary text-sm">Restoring your session...</p>
    </div>
  );
}
