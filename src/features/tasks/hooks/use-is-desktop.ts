'use client';

import { useSyncExternalStore } from 'react';

const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

function subscribe(onChange: () => void): () => void {
  const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);

  mediaQuery.addEventListener('change', onChange);

  return () => {
    mediaQuery.removeEventListener('change', onChange);
  };
}

function getSnapshot(): boolean {
  return window.matchMedia(DESKTOP_MEDIA_QUERY).matches;
}

function getServerSnapshot(): null {
  return null;
}

export function useIsDesktop(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
