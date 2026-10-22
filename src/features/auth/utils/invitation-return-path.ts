const SAFE_BASE_URL = 'https://taskly.invalid';

export function getSafeInvitationReturnPath(value: unknown): string | null {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 2048 ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\') ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return null;
  }

  try {
    const url = new URL(value, SAFE_BASE_URL);

    if (url.origin !== SAFE_BASE_URL || url.pathname !== '/invite' || url.hash !== '') {
      return null;
    }

    return `/invite${url.search}`;
  } catch {
    return null;
  }
}

export function getAuthPageHref(page: '/login' | '/sign-up', returnPath: string | null): string {
  if (!returnPath) {
    return page;
  }

  const params = new URLSearchParams({
    next: returnPath,
  });

  return `${page}?${params.toString()}`;
}
