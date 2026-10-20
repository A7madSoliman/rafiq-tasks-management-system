'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { taskDetailsSchema, type TaskDetails } from '../schemas/task-details-schema';

type TaskDetailsStatus = 'loading' | 'success' | 'error' | 'not-found';

type TaskDetailsState = {
  projectId: string;
  taskId: string;
  status: TaskDetailsStatus;
  task: TaskDetails | null;
};

export function useTaskDetails(projectId: string, taskId: string) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);

  const [state, setState] = useState<TaskDetailsState>({
    projectId,
    taskId,
    status: 'loading',
    task: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function loadTask() {
      setState({
        projectId,
        taskId,
        status: 'loading',
        task: null,
      });

      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectId)}/tasks/${encodeURIComponent(taskId)}`,
          {
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

        if (response.status === 404) {
          setState({
            projectId,
            taskId,
            status: 'not-found',
            task: null,
          });
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load task details');
        }

        const data: unknown = await response.json();

        if (controller.signal.aborted) return;

        const parsed = taskDetailsSchema.safeParse(data);

        if (!parsed.success || parsed.data.id !== taskId || parsed.data.projectId !== projectId) {
          throw new Error('Invalid task details response');
        }

        setState({
          projectId,
          taskId,
          status: 'success',
          task: parsed.data,
        });
      } catch {
        if (!controller.signal.aborted) {
          setState({
            projectId,
            taskId,
            status: 'error',
            task: null,
          });
        }
      }
    }

    void loadTask();

    return () => controller.abort();
  }, [projectId, taskId, attempt, router]);

  const isCurrent = state.projectId === projectId && state.taskId === taskId;

  return {
    status: isCurrent ? state.status : ('loading' as const),
    task: isCurrent ? state.task : null,
    retry: () => setAttempt((current) => current + 1),
  };
}
