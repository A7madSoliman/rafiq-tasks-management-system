'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { epicTaskSchema, type EpicTask } from '../schemas/epic-task-schema';

type TasksState = {
  refreshRevision: number;
  projectId: string;
  epicId: string;
  status: 'loading' | 'success' | 'error';
  tasks: EpicTask[];
};

export function useEpicTasks(projectId: string, epicId: string, refreshRevision = 0) {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<TasksState>({
    refreshRevision,
    projectId,
    epicId,
    status: 'loading',
    tasks: [],
  });

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setState({ projectId, epicId, refreshRevision, status: 'loading', tasks: [] });
      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectId)}/epics/${encodeURIComponent(epicId)}/tasks`,
          { signal: controller.signal, cache: 'no-store' },
        );
        if (controller.signal.aborted) return;
        if (response.status === 401) {
          router.replace('/login');
          router.refresh();
          return;
        }
        if (!response.ok) throw new Error('Unable to load epic tasks');
        const data: unknown = await response.json();
        if (controller.signal.aborted) return;
        const parsed = epicTaskSchema.array().safeParse(data);
        if (!parsed.success) throw new Error('Invalid epic tasks response');
        setState({ projectId, epicId, refreshRevision, status: 'success', tasks: parsed.data });
      } catch {
        if (!controller.signal.aborted) {
          setState({ projectId, epicId, refreshRevision, status: 'error', tasks: [] });
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [projectId, epicId, attempt, router, refreshRevision]);

  const current =
    state.projectId === projectId &&
    state.epicId === epicId &&
    state.refreshRevision === refreshRevision;
  return {
    tasks: current ? state.tasks : [],
    status: current ? state.status : ('loading' as const),
    retry: () => setAttempt((value) => value + 1),
  };
}
