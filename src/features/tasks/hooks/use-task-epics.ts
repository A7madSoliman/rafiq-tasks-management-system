'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProjectEpic } from '@/features/epics/types/project-epic';
import { isProjectEpics } from '@/features/epics/utils/map-project-epics';
import { parseContentRangeTotal } from '@/features/projects/utils/parse-content-range';

type TaskEpicsStatus = 'loading' | 'success' | 'error';

type TaskEpicsState = {
  projectId: string;
  epics: ProjectEpic[];
  status: TaskEpicsStatus;
};

const PAGE_SIZE = 100;

export function useTaskEpics(projectId: string) {
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);

  const [state, setState] = useState<TaskEpicsState>({
    projectId,
    epics: [],
    status: 'loading',
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadEpics() {
      const allEpics: ProjectEpic[] = [];
      let offset = 0;

      try {
        while (!controller.signal.aborted) {
          const params = new URLSearchParams({
            limit: String(PAGE_SIZE),
            offset: String(offset),
          });

          const response = await fetch(
            `/api/projects/${encodeURIComponent(projectId)}/epics?${params}`,
            {
              method: 'GET',
              signal: controller.signal,
              cache: 'no-store',
            },
          );

          if (controller.signal.aborted) return;

          if (response.status === 401) {
            router.replace('/login');
            router.refresh();
            return;
          }

          const data: unknown = await response.json().catch(() => null);

          if (controller.signal.aborted) return;

          const totalCount = parseContentRangeTotal(response.headers.get('content-range'));

          if (!response.ok || !isProjectEpics(data) || totalCount === null) {
            setState({
              projectId,
              epics: [],
              status: 'error',
            });
            return;
          }

          allEpics.push(...data);

          if (allEpics.length >= totalCount) {
            setState({
              projectId,
              epics: allEpics,
              status: 'success',
            });
            return;
          }

          if (data.length === 0) {
            setState({
              projectId,
              epics: [],
              status: 'error',
            });
            return;
          }

          offset += data.length;
        }
      } catch {
        if (controller.signal.aborted) return;

        setState({
          projectId,
          epics: [],
          status: 'error',
        });
      }
    }

    void loadEpics();

    return () => {
      controller.abort();
    };
  }, [projectId, retryCount, router]);

  const isCurrentProject = state.projectId === projectId;

  function retry() {
    setState({
      projectId,
      epics: [],
      status: 'loading',
    });

    setRetryCount((count) => count + 1);
  }

  return {
    epics: isCurrentProject ? state.epics : [],
    status: isCurrentProject ? state.status : 'loading',
    retry,
  };
}
