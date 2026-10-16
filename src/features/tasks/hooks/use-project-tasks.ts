'use client';

import { useRouter } from 'next/navigation';
import { parseContentRangeTotal } from '@/features/projects/utils/parse-content-range';
import { createdTaskSchema, type CreatedTask } from '../schemas/created-task-schema';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TASK_STATUSES, type TaskStatus } from '../constants/task-statuses';

type ProjectTasksStatus = 'loading' | 'success' | 'error';

type ProjectTasksColumn = {
  tasks: CreatedTask[];
  status: ProjectTasksStatus;
};

type ProjectTasksState = {
  projectId: string;
  columns: Partial<Record<TaskStatus, ProjectTasksColumn>>;
};

const PAGE_SIZE = 100;

export function useProjectTasks(projectId: string) {
  const router = useRouter();
  const [state, setState] = useState<ProjectTasksState>({
    projectId,
    columns: {},
  });

  const controllersRef = useRef(new Map<TaskStatus, AbortController>());

  const loadColumn = useCallback(
    async (status: TaskStatus) => {
      if (!projectId) return;

      controllersRef.current.get(status)?.abort();

      const controller = new AbortController();
      controllersRef.current.set(status, controller);

      setState((current) => ({
        projectId,
        columns: {
          ...(current.projectId === projectId ? current.columns : {}),
          [status]: { tasks: [], status: 'loading' },
        },
      }));

      const tasks: CreatedTask[] = [];
      let offset = 0;

      try {
        while (!controller.signal.aborted) {
          const params = new URLSearchParams({
            status,
            limit: String(PAGE_SIZE),
            offset: String(offset),
          });

          const response = await fetch(
            `/api/projects/${encodeURIComponent(projectId)}/tasks?${params}`,
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

          const total = parseContentRangeTotal(response.headers.get('content-range'));

          const data: unknown = await response.json().catch(() => null);

          if (controller.signal.aborted) return;

          const parsed = createdTaskSchema.array().safeParse(data);

          if (
            !response.ok ||
            total === null ||
            !parsed.success ||
            parsed.data.some((task) => task.project_id !== projectId || task.status !== status)
          ) {
            throw new Error('Invalid column response');
          }

          tasks.push(...parsed.data);

          if (tasks.length >= total) {
            setState((current) =>
              current.projectId === projectId
                ? {
                    ...current,
                    columns: {
                      ...current.columns,
                      [status]: { tasks, status: 'success' },
                    },
                  }
                : current,
            );

            return;
          }

          if (parsed.data.length === 0) {
            throw new Error('Incomplete column response');
          }

          offset += parsed.data.length;
        }
      } catch {
        if (controller.signal.aborted) return;

        setState((current) =>
          current.projectId === projectId
            ? {
                ...current,
                columns: {
                  ...current.columns,
                  [status]: { tasks: [], status: 'error' },
                },
              }
            : current,
        );
      } finally {
        if (controllersRef.current.get(status) === controller) {
          controllersRef.current.delete(status);
        }
      }
    },
    [projectId, router],
  );

  useEffect(() => {
    TASK_STATUSES.forEach(({ value }) => {
      void loadColumn(value);
    });

    const controllers = controllersRef.current;

    return () => {
      controllers.forEach((controller) => controller.abort());
      controllers.clear();
    };
  }, [loadColumn]);

  return {
    columns: state.projectId === projectId ? state.columns : {},
    retryColumn: loadColumn,
  };
}
