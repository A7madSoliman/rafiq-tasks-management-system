'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { ProjectEpic } from '../types/project-epic';
import { isProjectEpic } from '../utils/map-project-epics';

type EpicDetailsStatus = 'idle' | 'loading' | 'success' | 'error';

type EpicDetailsState = {
  projectId: string;
  epicId: string | null;
  epic: ProjectEpic | null;
  status: EpicDetailsStatus;
  errorMessage: string | null;
};

export function useEpicDetails(projectId: string, epicId: string | null) {
  const router = useRouter();

  const [state, setState] = useState<EpicDetailsState>({
    projectId,
    epicId,
    epic: null,
    status: epicId ? 'loading' : 'idle',
    errorMessage: null,
  });

  const loadEpic = useCallback(
    async (selectedEpicId: string, signal?: AbortSignal) => {
      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectId)}/epics/${encodeURIComponent(selectedEpicId)}`,
          {
            method: 'GET',
            signal,
            cache: 'no-store',
          },
        );

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
              : 'Unable to load epic details.';

          setState((current) => {
            if (current.projectId !== projectId || current.epicId !== selectedEpicId) {
              return current;
            }

            return {
              ...current,
              epic: null,
              status: 'error',
              errorMessage: message,
            };
          });

          return;
        }

        if (!isProjectEpic(data)) {
          setState((current) => {
            if (current.projectId !== projectId || current.epicId !== selectedEpicId) {
              return current;
            }

            return {
              ...current,
              epic: null,
              status: 'error',
              errorMessage: 'Unable to load epic details.',
            };
          });

          return;
        }

        setState((current) => {
          if (current.projectId !== projectId || current.epicId !== selectedEpicId) {
            return current;
          }

          return {
            ...current,
            epic: data,
            status: 'success',
            errorMessage: null,
          };
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setState((current) => {
          if (current.projectId !== projectId || current.epicId !== selectedEpicId) {
            return current;
          }

          return {
            ...current,
            epic: null,
            status: 'error',
            errorMessage: 'Unable to load epic details.',
          };
        });
      }
    },
    [projectId, router],
  );

  useEffect(() => {
    const controller = new AbortController();

    if (!epicId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({
        projectId,
        epicId: null,
        epic: null,
        status: 'idle',
        errorMessage: null,
      });

      return;
    }

    setState({
      projectId,
      epicId,
      epic: null,
      status: 'loading',
      errorMessage: null,
    });

    void loadEpic(epicId, controller.signal);

    return () => {
      controller.abort();
    };
  }, [epicId, loadEpic, projectId]);

  const isCurrentSelection = state.projectId === projectId && state.epicId === epicId;

  return {
    epic: isCurrentSelection ? state.epic : null,
    status: isCurrentSelection ? state.status : epicId ? 'loading' : 'idle',
    errorMessage: isCurrentSelection ? state.errorMessage : null,
  };
}
