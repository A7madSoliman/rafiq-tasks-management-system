'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { parseContentRangeTotal } from '@/features/projects/utils/parse-content-range';

import { EPICS_PAGE_SIZE } from '../constants/epics-pagination';
import type { ProjectEpic } from '../types/project-epic';
import { isProjectEpics } from '../utils/map-project-epics';

type ProjectEpicsStatus = 'loading' | 'success' | 'error';

type ProjectEpicsState = {
  projectId: string;
  page: number;
  epics: ProjectEpic[];
  totalCount: number;
  status: ProjectEpicsStatus;
};

export function useProjectEpics(projectId: string, currentPage = 1) {
  const router = useRouter();

  const [state, setState] = useState<ProjectEpicsState>({
    projectId,
    page: currentPage,
    epics: [],
    totalCount: 0,
    status: 'loading',
  });

  const loadEpics = useCallback(
    async (page: number, signal?: AbortSignal) => {
      const offset = (page - 1) * EPICS_PAGE_SIZE;

      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectId)}/epics?limit=${EPICS_PAGE_SIZE}&offset=${offset}`,
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

        const totalCount = parseContentRangeTotal(response.headers.get('content-range'));

        if (response.status === 416 && totalCount !== null) {
          const lastPage = Math.max(Math.ceil(totalCount / EPICS_PAGE_SIZE), 1);

          router.replace(`/project/${encodeURIComponent(projectId)}/epics?page=${lastPage}`);

          return;
        }

        const data: unknown = await response.json().catch(() => null);

        if (!response.ok || !isProjectEpics(data) || totalCount === null) {
          setState({
            projectId,
            page,
            epics: [],
            totalCount: 0,
            status: 'error',
          });

          return;
        }

        setState({
          projectId,
          page,
          epics: data,
          totalCount,
          status: 'success',
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setState({
          projectId,
          page,
          epics: [],
          totalCount: 0,
          status: 'error',
        });
      }
    },
    [projectId, router],
  );

  useEffect(() => {
    const controller = new AbortController();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEpics(currentPage, controller.signal);

    return () => {
      controller.abort();
    };
  }, [currentPage, loadEpics]);

  const isCurrentPage = state.projectId === projectId && state.page === currentPage;

  function retry() {
    setState({
      projectId,
      page: currentPage,
      epics: [],
      totalCount: 0,
      status: 'loading',
    });

    void loadEpics(currentPage);
  }

  return {
    epics: isCurrentPage ? state.epics : [],
    totalCount: isCurrentPage ? state.totalCount : 0,
    status: isCurrentPage ? state.status : 'loading',
    retry,
  };
}
