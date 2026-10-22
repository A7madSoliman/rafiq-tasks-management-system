'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import CloseIcon from '@/assets/icons/navigation/close.svg';
import InviteDialogIcon from '@/assets/icons/projects/invite-dialog.svg';
import InviteEmailIcon from '@/assets/icons/projects/invite-email.svg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel } from '@/components/ui/field-label';

import { inviteMemberSchema, type InviteMemberFormValues } from '../schemas/invite-member-schema';

type InviteMemberDialogProps = {
  projectId: string;
  projectName: string;
  onClose: () => void;
};

function getResponseMessage(value: unknown): string | null {
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

export function InviteMemberDialog({ projectId, projectName, onClose }: InviteMemberDialogProps) {
  const router = useRouter();

  const dialogRef = useRef<HTMLElement>(null);
  const requestInFlightRef = useRef(false);

  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteMemberFormValues>({
    resolver: zodResolver(inviteMemberSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  const requestClose = useCallback(() => {
    if (!requestInFlightRef.current) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }

      const dialog = dialogRef.current;

      const focusableElements = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    dialogRef.current?.querySelector<HTMLInputElement>('#invite-email')?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement?.focus();
    };
  }, [requestClose]);

  async function onSubmit(values: InviteMemberFormValues) {
    if (requestInFlightRef.current) {
      return;
    }

    requestInFlightRef.current = true;
    setSubmitError(null);

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
        }),
      });

      if (response.status === 401) {
        router.replace('/login');
        router.refresh();
        return;
      }

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setSubmitError(getResponseMessage(data) ?? 'Unable to send invitation. Please try again.');
        return;
      }

      toast.success('Invitation sent successfully.');

      // Keep the dialog open to allow more invitations.
      reset({
        email: '',
      });
    } catch {
      setSubmitError('Unable to connect. Please try again.');
    } finally {
      requestInFlightRef.current = false;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center lg:p-6">
      <div
        aria-hidden="true"
        className="bg-foreground/40 absolute inset-0 backdrop-blur-[2px] lg:backdrop-blur-[6px]"
      />

      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-member-title"
        aria-describedby="invite-member-description"
        tabIndex={-1}
        className="bg-surface relative z-10 flex max-h-[95dvh] w-full max-w-[448px] flex-col overflow-y-auto rounded-t-[32px] p-8 shadow-[0_-4px_12px_rgba(4,27,60,0.06)] outline-none lg:rounded-md lg:shadow-[0_24px_48px_-12px_rgba(4,27,60,0.12)]"
      >
        {/* Mobile handle */}
        <div
          aria-hidden="true"
          className="bg-outline/30 mx-auto mb-3 h-[6px] w-12 shrink-0 rounded-full lg:hidden"
        />

        <header>
          <div className="flex items-start justify-between">
            <div className="bg-surface-low flex size-12 items-center justify-center rounded-md">
              <InviteDialogIcon aria-hidden="true" />
            </div>

            <button
              type="button"
              aria-label="Close invitation dialog"
              onClick={requestClose}
              disabled={isSubmitting}
              className="flex size-9 cursor-pointer items-center justify-center rounded-md disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CloseIcon aria-hidden="true" />
            </button>
          </div>

          <h2
            id="invite-member-title"
            className="text-foreground mt-2 text-2xl leading-8 font-bold tracking-[-0.6px] lg:mt-4"
          >
            Invite Team Member
          </h2>

          <p
            id="invite-member-description"
            className="text-foreground-muted mt-2 text-sm leading-5"
          >
            Send an invitation to join the {projectName} workspace.
          </p>
        </header>

        <form
          noValidate
          onSubmit={(event) => {
            void handleSubmit(onSubmit)(event);
          }}
          className="mt-6 flex flex-col gap-6"
        >
          {' '}
          <div className="flex flex-col gap-2">
            <FieldLabel
              htmlFor="invite-email"
              className="text-foreground-secondary text-[11px] leading-[16.5px] font-bold tracking-[1.1px] uppercase"
            >
              Email Address
            </FieldLabel>

            <div className="relative">
              <Input
                id="invite-email"
                type="email"
                autoComplete="email"
                placeholder="Enter email address"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'invite-email-error' : undefined}
                disabled={isSubmitting}
                className="bg-surface-highest h-12 rounded-sm px-4 pr-11 text-base"
                {...register('email')}
              />

              <InviteEmailIcon
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2"
              />
            </div>

            {errors.email && (
              <p id="invite-email-error" role="alert" className="text-error text-xs">
                {errors.email.message}
              </p>
            )}
          </div>
          {submitError && (
            <p role="alert" className="text-error text-xs">
              {submitError}
            </p>
          )}
          <div className="flex flex-col gap-3 pt-4 lg:flex-row lg:pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="order-1 h-12 w-full cursor-pointer rounded-md text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 lg:order-2 lg:flex-1"
            >
              {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={requestClose}
              disabled={isSubmitting}
              className="text-foreground-secondary order-2 h-12 w-full cursor-pointer rounded-md text-sm font-semibold opacity-100 disabled:cursor-not-allowed disabled:opacity-50 lg:order-1 lg:flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
