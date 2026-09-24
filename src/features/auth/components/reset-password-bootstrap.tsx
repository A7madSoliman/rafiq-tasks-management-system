'use client';

import { useEffect, useState } from 'react';
import { ResetPasswordForm } from './reset-password-form';

type BootstrapStatus = 'checking' | 'ready' | 'invalid';

export function ResetPasswordBootstrap() {
  const [status, setStatus] = useState<BootstrapStatus>('checking');

  useEffect(() => {
    let cancelled = false;

    async function bootstrapRecovery() {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);

      const accessToken = params.get('access_token');
      const type = params.get('type');

      try {
        if (hash) {
          const response = await fetch('/api/auth/reset-password/bootstrap', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accessToken: accessToken ?? '',
              type: type ?? '',
            }),
          });

          window.history.replaceState(
            window.history.state,
            '',
            `${window.location.pathname}${window.location.search}`,
          );

          if (!response.ok) {
            if (!cancelled) {
              setStatus('invalid');
            }

            return;
          }

          if (!cancelled) {
            setStatus('ready');
          }

          return;
        }

        const response = await fetch('/api/auth/reset-password/bootstrap', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!cancelled) {
          setStatus(response.ok ? 'ready' : 'invalid');
        }
      } catch {
        if (!cancelled) {
          setStatus('invalid');
        }
      }
    }

    void bootstrapRecovery();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'checking') {
    return <p className="text-foreground-secondary text-sm">Checking reset link...</p>;
  }

  if (status === 'invalid') {
    return (
      <p role="alert" className="text-error text-sm">
        Invalid or expired reset link.
      </p>
    );
  }

  return <ResetPasswordForm />;
}
