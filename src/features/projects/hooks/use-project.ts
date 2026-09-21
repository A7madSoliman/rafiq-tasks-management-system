'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { ProjectDetails } from '../types/project';

type ProjectStatus = 'loading' | 'success' | 'error';

function isProjectDetails(value: unknown): value is ProjectDetails {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'description' in value &&
    (typeof value.description === 'string' || value.description === null)
  );
}

export function useProject(projectId: string) {
  const router = useRouter();

  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [status, setStatus] = useState<ProjectStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProject = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
          method: 'GET',
          signal,
        });

        if (response.status === 401) {
          router.replace('/login');
          router.refresh();
          return;
        }

        const data: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            typeof data === 'object' &&
            data !== null &&
            'message' in data &&
            typeof data.message === 'string'
              ? data.message
              : 'Unable to load project.';

          setErrorMessage(message);
          setStatus('error');
          return;
        }

        if (!isProjectDetails(data)) {
          setErrorMessage('Unable to load project.');
          setStatus('error');
          return;
        }

        setProject(data);
        setErrorMessage(null);
        setStatus('success');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setErrorMessage('Unable to load project.');
        setStatus('error');
      }
    },
    [projectId, router],
  );

  useEffect(() => {
    const controller = new AbortController();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProject(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadProject]);

  function retry() {
    setStatus('loading');
    setErrorMessage(null);
    void loadProject();
  }

  return {
    project,
    status,
    errorMessage,
    retry,
  };
}
