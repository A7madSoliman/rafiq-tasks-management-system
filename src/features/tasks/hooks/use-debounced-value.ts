'use client';

import { useEffect, useState } from 'react';

const DEFAULT_DEBOUNCE_DELAY = 400;

export function useDebouncedValue(value: string, delay = DEFAULT_DEBOUNCE_DELAY): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [value, delay]);

  return debouncedValue;
}
