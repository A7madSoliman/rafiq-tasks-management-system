'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseContentRangeTotal } from '@/features/projects/utils/parse-content-range';
import { createdTaskSchema, type CreatedTask } from '../schemas/created-task-schema';

type ProjectTasksStatus = 'loading' | 'success' | 'error';

type ProjectTasksState = {
  projectId: string;
  tasks: CreatedTask[];
  status: ProjectTasksStatus;
};

const PAGE_SIZE = 100;

export function useProjectTasks(projectId: string) {
  const router = useRouter();

  const [retryCount, setRetryCount] = useState(0);

  const [state, setState] = useState<ProjectTasksState>({
    projectId,
    tasks: [],
    status: 'loading',
  });

  useEffect(() => {
    if (!projectId) return;

    const controller = new AbortController();

    async function loadTasks() {
      const allTasks: CreatedTask[] = [];
      let offset = 0;

      try {
        while (!controller.signal.aborted) {
          const params = new URLSearchParams({
            limit: String(PAGE_SIZE),
            offset: String(offset),
          });

          const response = await fetch(
            `/api/projects/${encodeURIComponent(projectId)}/tasks?${params.toString()}`,
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

          const totalCount = parseContentRangeTotal(response.headers.get('content-range'));

          const data: unknown = await response.json().catch(() => null);

          if (controller.signal.aborted) return;

          const parsedTasks = createdTaskSchema.array().safeParse(data);

          if (
            !response.ok ||
            totalCount === null ||
            !parsedTasks.success ||
            parsedTasks.data.some((task) => task.project_id !== projectId)
          ) {
            setState({
              projectId,
              tasks: [],
              status: 'error',
            });

            return;
          }

          allTasks.push(...parsedTasks.data);

          if (allTasks.length >= totalCount) {
            setState({
              projectId,
              tasks: allTasks,
              status: 'success',
            });

            return;
          }

          if (parsedTasks.data.length === 0) {
            setState({
              projectId,
              tasks: [],
              status: 'error',
            });

            return;
          }

          offset += parsedTasks.data.length;
        }
      } catch {
        if (controller.signal.aborted) return;

        setState({
          projectId,
          tasks: [],
          status: 'error',
        });
      }
    }

    void loadTasks();

    return () => {
      controller.abort();
    };
  }, [projectId, retryCount, router]);

  const isCurrentProject = state.projectId === projectId;

  function retry() {
    setState({
      projectId,
      tasks: [],
      status: 'loading',
    });

    setRetryCount((count) => count + 1);
  }

  return {
    tasks: isCurrentProject ? state.tasks : [],
    status: isCurrentProject ? state.status : 'loading',
    retry,
  };
}
