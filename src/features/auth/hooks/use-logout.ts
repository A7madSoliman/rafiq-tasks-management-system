'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useLogout() {
  const router = useRouter();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const isLoggingOutRef = useRef(false);

  async function logout() {
    if (isLoggingOutRef.current) {
      return;
    }

    isLoggingOutRef.current = true;
    setIsLoggingOut(true);

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (!response.ok) {
        toast.error('Logout failed, please try again.');

        isLoggingOutRef.current = false;
        setIsLoggingOut(false);
        return;
      }

      router.replace('/login');
      router.refresh();
    } catch {
      toast.error('Logout failed, please try again.');

      isLoggingOutRef.current = false;
      setIsLoggingOut(false);
    }
  }

  return {
    logout,
    isLoggingOut,
  };
}
