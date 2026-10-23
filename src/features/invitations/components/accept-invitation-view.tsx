'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import ProjectInvitationIcon from '@/assets/icons/invitations/project-invitation.svg';
import { Button } from '@/components/ui/button';
import { getAuthPageHref } from '@/features/auth/utils/invitation-return-path';

type AcceptInvitationViewProps = {
  token: string;
};

type AcceptResponse = {
  message: string;
  projectId: string | null;
};

function isAcceptResponse(value: unknown): value is AcceptResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string' &&
    'projectId' in value &&
    (typeof value.projectId === 'string' || value.projectId === null)
  );
}

function getErrorMessage(value: unknown): string | null {
  if (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  ) {
    return value.message;
  }

  return null;
}

export function AcceptInvitationView({ token }: AcceptInvitationViewProps) {
  const router = useRouter();

  const requestInFlightRef = useRef(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function acceptInvitation() {
    if (requestInFlightRef.current) {
      return;
    }

    requestInFlightRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
        cache: 'no-store',
      });

      if (response.status === 401) {
        const returnPath = `/invite?${new URLSearchParams({
          token,
        }).toString()}`;

        router.replace(getAuthPageHref('/login', returnPath));

        return;
      }

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setError(getErrorMessage(data) ?? 'Unable to accept invitation. Please try again.');

        return;
      }

      if (!isAcceptResponse(data)) {
        setError('Unexpected invitation response.');
        return;
      }

      const destination = data.projectId
        ? `/project/${encodeURIComponent(data.projectId)}/tasks`
        : '/project';

      router.replace(destination);
      router.refresh();
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      requestInFlightRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <section
      aria-labelledby="accept-invitation-title"
      className="bg-surface relative w-full max-w-full min-w-0 overflow-hidden rounded-md px-6 py-10 shadow-[0_24px_48px_-12px_rgba(4,27,60,0.06)] sm:p-12"
    >
      <div
        aria-hidden="true"
        className="from-primary to-primary-container absolute inset-x-0 top-0 h-1 bg-gradient-to-r"
      />

      <div className="flex flex-col items-center text-center">
        <div className="bg-surface-icon mb-6 inline-flex items-center gap-1.5 rounded-xl px-3 py-1">
          <ProjectInvitationIcon aria-hidden="true" />

          <span className="text-foreground-muted text-[11px] leading-[17px] font-bold tracking-[0.55px] uppercase">
            New Project Invitation
          </span>
        </div>

        <h1
          id="accept-invitation-title"
          className="text-foreground mb-4 max-w-[420px] text-[30px] leading-9 font-semibold tracking-[-0.75px]"
        >
          You&apos;ve been invited to join new project
        </h1>

        {error && (
          <p role="alert" className="text-error mb-4 w-full text-sm">
            {error}
          </p>
        )}

        <Button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            void acceptInvitation();
          }}
          className="h-[52px] w-full cursor-pointer rounded-sm text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Accepting Invitation...' : 'Accept Invitation'}
        </Button>
      </div>
    </section>
  );
}
