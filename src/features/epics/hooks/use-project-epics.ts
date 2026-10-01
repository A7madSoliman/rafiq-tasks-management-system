'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { ProjectEpic } from '../types/project-epic';
import { isProjectEpics } from '../utils/map-project-epics';

type ProjectEpicsStatus = 'loading' | 'success' | 'error';

type ProjectEpicsState = {
  projectId: string;
  epics: ProjectEpic[];
  status: ProjectEpicsStatus;
};

export function useProjectEpics(projectId: string) {
  const router = useRouter();

  const [state, setState] = useState<ProjectEpicsState>({
    projectId,
    epics: [],
    status: 'loading',
  });

  const loadEpics = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}/epics`, {
          method: 'GET',
          signal,
          cache: 'no-store',
        });

        if (response.status === 401) {
          router.replace('/login');
          router.refresh();
          return;
        }

        const data: unknown = await response.json().catch(() => null);

        if (!response.ok || !isProjectEpics(data)) {
          setState({
            projectId,
            epics: [],
            status: 'error',
          });
          return;
        }

        setState({
          projectId,
          epics: data,
          status: 'success',
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setState({
          projectId,
          epics: [],
          status: 'error',
        });
      }
    },
    [projectId, router],
  );

  useEffect(() => {
    const controller = new AbortController();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEpics(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadEpics]);

  const isCurrentProject = state.projectId === projectId;

  function retry() {
    setState({
      projectId,
      epics: [],
      status: 'loading',
    });

    void loadEpics();
  }

  return {
    epics: isCurrentProject ? state.epics : [],
    status: isCurrentProject ? state.status : 'loading',
    retry,
  };
}
