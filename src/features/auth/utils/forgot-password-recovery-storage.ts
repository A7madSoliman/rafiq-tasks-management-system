const RECOVERY_STORAGE_PREFIX = 'forgot-password-recovery:';

export type StoredRecovery = {
  email: string;
  resendCount: number;
  nextResendAt: number;
};

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getRecoveryStorageKey(email: string) {
  return `${RECOVERY_STORAGE_PREFIX}${encodeURIComponent(normalizeEmail(email))}`;
}

export function readStoredRecovery(email: string): StoredRecovery | null {
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

export function writeStoredRecovery(recovery: StoredRecovery) {
  sessionStorage.setItem(getRecoveryStorageKey(recovery.email), JSON.stringify(recovery));
}
