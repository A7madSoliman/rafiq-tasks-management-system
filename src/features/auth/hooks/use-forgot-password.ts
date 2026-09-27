'use client';

import { useEffect, useState } from 'react';
import {
  readStoredRecovery,
  writeStoredRecovery,
  normalizeEmail,
  type StoredRecovery,
} from '../utils/forgot-password-recovery-storage';

const RESEND_COOLDOWN_MS = 5 * 60 * 1000;
const MAX_RESEND_ATTEMPTS = 3;

async function sendResetLink(email: string, fallbackMessage: string) {
  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof data.message === 'string'
        ? data.message
        : fallbackMessage;

    return {
      ok: false as const,
      message,
    };
  }

  return {
    ok: true as const,
  };
}

export function useForgotPassword(emailValue: string) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [requestEmail, setRequestEmail] = useState<string | null>(null);
  const [nextResendAt, setNextResendAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [isResending, setIsResending] = useState(false);

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

  const requestResetLink = async (emailValueToSubmit: string) => {
    setSubmitError(null);

    const email = normalizeEmail(emailValueToSubmit);
    const existingRecovery = readStoredRecovery(email);

    if (existingRecovery) {
      const remainingSeconds = Math.max(
        0,
        Math.ceil((existingRecovery.nextResendAt - Date.now()) / 1000),
      );

      setRequestEmail(existingRecovery.email);
      setResendCount(existingRecovery.resendCount);
      setSecondsLeft(remainingSeconds);
      setNextResendAt(existingRecovery.nextResendAt);

      return;
    }

    try {
      const result = await sendResetLink(email, 'Unable to send reset link. Please try again.');

      if (!result.ok) {
        setSubmitError(result.message);
        return;
      }

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
    } catch {
      setSubmitError('Unable to connect. Please try again.');
    }
  };

  const resendResetLink = async () => {
    if (!requestEmail || secondsLeft > 0 || resendCount >= MAX_RESEND_ATTEMPTS || isResending) {
      return;
    }

    setIsResending(true);
    setSubmitError(null);

    try {
      const result = await sendResetLink(
        requestEmail,
        'Unable to resend reset link. Please try again.',
      );

      if (!result.ok) {
        setSubmitError(result.message);
        return;
      }

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

      writeStoredRecovery(recovery);
    } catch {
      setSubmitError('Unable to connect. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return {
    requestEmail,
    secondsLeft,
    resendCount,
    isResending,
    submitError,
    requestResetLink,
    resendResetLink,
    resendLimitReached: resendCount >= MAX_RESEND_ATTEMPTS,
    remainingAttempts: Math.max(0, MAX_RESEND_ATTEMPTS - resendCount),
  };
}
