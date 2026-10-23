'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type SessionRestoreProps = {
  loginHref?: string;
};

export function SessionRestore({ loginHref = '/login' }: SessionRestoreProps) {
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
          router.replace(loginHref);
          router.refresh();
          return;
        }

        router.refresh();
      } catch {
        router.replace(loginHref);
        router.refresh();
      }
    }

    void restoreSession();
  }, [router, loginHref]);

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p role="status" className="text-foreground-secondary text-sm">
        Restoring your session...
      </p>
    </div>
  );
}
