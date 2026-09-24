'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import SuccessCircleIcon from '@/assets/icons/success-circle.svg';
import { Button } from '@/components/ui/button';
import { FieldLabel } from '@/components/ui/field-label';
import { Input } from '@/components/ui/input';
import ArrowLeftIcon from '@/assets/icons/arrow-left.svg';

import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from '../schemas/forgot-password-schema';

const RESEND_COOLDOWN_MS = 5 * 60 * 1000;
const MAX_RESEND_ATTEMPTS = 3;
const RECOVERY_STORAGE_PREFIX = 'forgot-password-recovery:';

type StoredRecovery = {
  email: string;
  resendCount: number;
  nextResendAt: number;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getRecoveryStorageKey(email: string) {
  return `${RECOVERY_STORAGE_PREFIX}${encodeURIComponent(normalizeEmail(email))}`;
}

function readStoredRecovery(email: string): StoredRecovery | null {
  const storedRecovery = sessionStorage.getItem(getRecoveryStorageKey(email));

  if (!storedRecovery) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(storedRecovery);

    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('email' in parsed) ||
      typeof parsed.email !== 'string' ||
      !('resendCount' in parsed) ||
      typeof parsed.resendCount !== 'number' ||
      !('nextResendAt' in parsed) ||
      typeof parsed.nextResendAt !== 'number'
    ) {
      sessionStorage.removeItem(getRecoveryStorageKey(email));
      return null;
    }

    return {
      email: parsed.email,
      resendCount: parsed.resendCount,
      nextResendAt: parsed.nextResendAt,
    };
  } catch {
    sessionStorage.removeItem(getRecoveryStorageKey(email));
    return null;
  }
}

function writeStoredRecovery(recovery: StoredRecovery) {
  sessionStorage.setItem(getRecoveryStorageKey(recovery.email), JSON.stringify(recovery));
}

export function ForgotPasswordForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [requestEmail, setRequestEmail] = useState<string | null>(null);
  const [nextResendAt, setNextResendAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
    },
  });

  const emailValue = useWatch({
    control,
    name: 'email',
    defaultValue: '',
  });

  const normalizedEmail = normalizeEmail(emailValue);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!normalizedEmail) {
        setRequestEmail(null);
        setResendCount(0);
        setSecondsLeft(0);
        setNextResendAt(null);
        return;
      }

      const storedRecovery = readStoredRecovery(normalizedEmail);

      if (!storedRecovery) {
        setRequestEmail(null);
        setResendCount(0);
        setSecondsLeft(0);
        setNextResendAt(null);
        return;
      }

      const remainingSeconds = Math.max(
        0,
        Math.ceil((storedRecovery.nextResendAt - Date.now()) / 1000),
      );

      setRequestEmail(storedRecovery.email);
      setResendCount(storedRecovery.resendCount);
      setSecondsLeft(remainingSeconds);
      setNextResendAt(storedRecovery.nextResendAt);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [normalizedEmail]);

  useEffect(() => {
    if (!nextResendAt) {
      return;
    }

    const updateCountdown = () => {
      const remainingSeconds = Math.max(0, Math.ceil((nextResendAt - Date.now()) / 1000));

      setSecondsLeft(remainingSeconds);
    };

    const timeoutId = window.setTimeout(updateCountdown, 0);
    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [nextResendAt]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setSubmitError(null);

    const email = normalizeEmail(values.email);

    const existingRecovery = readStoredRecovery(email);

    if (existingRecovery) {
      window.setTimeout(() => {
        const remainingSeconds = Math.max(
          0,
          Math.ceil((existingRecovery.nextResendAt - Date.now()) / 1000),
        );

        setRequestEmail(existingRecovery.email);
        setResendCount(existingRecovery.resendCount);
        setSecondsLeft(remainingSeconds);
        setNextResendAt(existingRecovery.nextResendAt);
      }, 0);

      return;
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          typeof data === 'object' &&
          data !== null &&
          'message' in data &&
          typeof data.message === 'string'
            ? data.message
            : 'Unable to send reset link. Please try again.';

        setSubmitError(message);
        return;
      }

      window.setTimeout(() => {
        const nextResendAtValue = Date.now() + RESEND_COOLDOWN_MS;

        const recovery: StoredRecovery = {
          email,
          resendCount: 0,
          nextResendAt: nextResendAtValue,
        };

        setRequestEmail(email);
        setResendCount(0);
        setSecondsLeft(RESEND_COOLDOWN_MS / 1000);
        setNextResendAt(nextResendAtValue);

        writeStoredRecovery(recovery);
      }, 0);
    } catch {
      setSubmitError('Unable to connect. Please try again.');
    }
  };

  const handleResend = async () => {
    if (!requestEmail || secondsLeft > 0 || resendCount >= MAX_RESEND_ATTEMPTS || isResending) {
      return;
    }

    setIsResending(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: requestEmail,
        }),
      });

      if (!response.ok) {
        setSubmitError('Unable to resend reset link. Please try again.');
        setIsResending(false);
        return;
      }

      window.setTimeout(() => {
        const nextCount = resendCount + 1;
        const nextResendAtValue = Date.now() + RESEND_COOLDOWN_MS;

        const recovery: StoredRecovery = {
          email: requestEmail,
          resendCount: nextCount,
          nextResendAt: nextResendAtValue,
        };

        setResendCount(nextCount);
        setSecondsLeft(RESEND_COOLDOWN_MS / 1000);
        setNextResendAt(nextResendAtValue);
        setIsResending(false);

        writeStoredRecovery(recovery);
      }, 0);
    } catch {
      setSubmitError('Unable to connect. Please try again.');
      setIsResending(false);
    }
  };

  return (
    <section aria-labelledby="forgot-password-title" className="w-full max-w-[448px]">
      <div className="bg-surface flex w-full flex-col rounded-md p-8 shadow-[0_24px_48px_-12px_rgba(4,27,60,0.06)] sm:gap-8 sm:border sm:border-[rgba(195,198,214,0.3)] sm:p-[41px]">
        <header className="text-center">
          <h1
            id="forgot-password-title"
            className="text-foreground text-2xl leading-8 font-semibold sm:text-[32px] sm:leading-10 sm:tracking-[-0.8px]"
          >
            Forgot password?
          </h1>

          <p className="text-foreground-secondary mt-2 text-[14px] leading-5 sm:leading-[22.75px]">
            No worries, we&apos;ll send you reset instructions.
          </p>
        </header>

        <form
          noValidate
          className="mt-8 flex flex-col gap-4 sm:mt-0 sm:gap-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <FieldLabel
              htmlFor="email"
              className="text-foreground-secondary text-[11px] leading-[16.5px] font-bold tracking-[0.55px] uppercase"
            >
              Email Address
            </FieldLabel>

            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              aria-invalid={Boolean(errors.email)}
              className="h-12 rounded-xs px-4 text-[16px] sm:rounded-sm"
              {...register('email')}
            />

            {errors.email && (
              <p className="text-error text-[11px] leading-[16.5px]">{errors.email.message}</p>
            )}
          </div>

          {submitError && (
            <p role="alert" className="text-error text-[12px] leading-[18px]">
              {submitError}
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-12 w-full cursor-pointer text-[14px] sm:text-[16px]"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <div className="mt-6 flex justify-center">
          <Link
            href="/login"
            className="text-primary flex items-center gap-2 text-[14px] leading-5 font-medium"
          >
            <ArrowLeftIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
            Back to log in
          </Link>
        </div>
      </div>

      {requestEmail && (
        <div className="mt-6 rounded-sm bg-[rgba(130,249,190,0.3)] p-4 backdrop-blur-[6px]">
          <div role="status" className="flex items-start gap-3">
            <SuccessCircleIcon aria-hidden="true" className="size-5 shrink-0" />

            <p className="text-[12px] leading-[19.5px] font-medium text-[#005235]">
              If an account exists with this email, we’ve sent a password reset link.
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[rgba(0,82,53,0.1)] pt-3">
            <span className="text-[11px] leading-[16.5px] font-bold tracking-[1.1px] text-[rgba(0,82,53,0.6)] uppercase">
              Didn&apos;t receive email?
            </span>

            <button
              type="button"
              onClick={handleResend}
              disabled={secondsLeft > 0 || resendCount >= MAX_RESEND_ATTEMPTS || isResending}
              className="text-primary cursor-pointer text-[11px] leading-[16.5px] font-bold tracking-[1.1px] uppercase disabled:cursor-not-allowed"
            >
              {resendCount >= MAX_RESEND_ATTEMPTS
                ? 'Resend limit reached'
                : isResending
                  ? 'Sending...'
                  : secondsLeft > 0
                    ? `Resend in ${formattedTime}`
                    : 'Resend'}
            </button>
          </div>

          <p className="mt-2 text-[11px] leading-[16.5px] text-[rgba(0,82,53,0.6)]">
            Resend attempts remaining: {Math.max(0, MAX_RESEND_ATTEMPTS - resendCount)}
          </p>
        </div>
      )}
    </section>
  );
}
