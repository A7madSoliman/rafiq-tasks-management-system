'use client';
import { useCallback, useEffect, useState } from 'react';
import { Project } from '../types/project';
import { mapProjects } from '../utils/map-projects';
import { useRouter } from 'next/navigation';

type ProjectsStatus = 'loading' | 'success' | 'error';

export function useProjects() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<ProjectsStatus>('loading');

  const loadProjects = useCallback(
    async (signal?: AbortSignal) => {
      setStatus('loading');
      try {
        const response = await fetch('/api/projects', {
          method: 'GET',
          signal: signal,
        });

        if (response.status === 401) {
          router.replace('/login');
          router.refresh();
          return;
        }

        if (!response.ok) {
          setStatus('error');
          return;
        }

        const data: unknown = await response.json();
        const mappedProjects = mapProjects(data);

        if (!mappedProjects) {
          setStatus('error');
          return;
        }
        setProjects(mappedProjects);
        setStatus('success');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setStatus('error');
      }
    },
    [router],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadProjects(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadProjects]);

  function retry() {
    void loadProjects();
  }
  return {
    projects,
    status,
    retry,
  };
}
