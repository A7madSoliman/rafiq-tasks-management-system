'use client';

import { useEffect, useState } from 'react';
import { ResetPasswordForm } from './reset-password-form';
import Link from 'next/link';

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

  if (status === 'invalid') {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p role="alert" className="text-error text-sm">
          Invalid or expired reset link.
        </p>

        <Link
          href="/forgot-password"
          className="bg-primary text-on-primary inline-flex h-12 items-center justify-center rounded-xs px-6 text-sm font-semibold"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm />;
}
