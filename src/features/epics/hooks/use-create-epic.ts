'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import type { CreateEpicFormValues } from '../schemas/create-epic-schema';

export function useCreateEpic(projectId: string) {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function createEpic(values: CreateEpicFormValues) {
    setSubmitError(null);

    try {
      const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/epics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.status === 401) {
        router.replace('/login');
        router.refresh();
        return;
      }

      if (!response.ok) {
        setSubmitError('Unable to create epic. Please try again.');
        return;
      }

      toast.success('Epic created successfully.');

      router.push(`/project/${encodeURIComponent(projectId)}/epics`);
      router.refresh();
    } catch {
      setSubmitError('Unable to create epic. Please try again.');
    }
  }

  return {
    createEpic,
    submitError,
  };
}
