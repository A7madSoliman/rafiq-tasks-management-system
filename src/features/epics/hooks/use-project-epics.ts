'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
  nextOffset: number;
  status: ProjectEpicsStatus;
  isLoadingMore: boolean;
  loadMoreError: boolean;
};

export function useProjectEpics(projectId: string, currentPage = 1) {
  const router = useRouter();

  const [state, setState] = useState<ProjectEpicsState>({
    projectId,
    page: currentPage,
    epics: [],
    totalCount: 0,
    nextOffset: 0,
    status: 'loading',
    isLoadingMore: false,
    loadMoreError: false,
  });

  const loadMoreInFlightRef = useRef(false);

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
            nextOffset: 0,
            status: 'error',
            isLoadingMore: false,
            loadMoreError: false,
          });

          return;
        }

        setState({
          projectId,
          page,
          epics: data,
          totalCount,
          nextOffset: offset + data.length,
          status: 'success',
          isLoadingMore: false,
          loadMoreError: false,
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
          nextOffset: 0,
          status: 'error',
          isLoadingMore: false,
          loadMoreError: false,
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

  const hasMore =
    isCurrentPage &&
    state.status === 'success' &&
    state.epics.length < state.totalCount &&
    state.nextOffset < state.totalCount;

  const loadMore = useCallback(async () => {
    if (
      !isCurrentPage ||
      state.status !== 'success' ||
      state.isLoadingMore ||
      state.loadMoreError ||
      state.epics.length >= state.totalCount ||
      state.nextOffset >= state.totalCount ||
      loadMoreInFlightRef.current
    ) {
      return;
    }

    const offset = state.nextOffset;

    loadMoreInFlightRef.current = true;

    setState((current) => {
      if (current.projectId !== projectId || current.page !== currentPage) {
        return current;
      }

      return {
        ...current,
        isLoadingMore: true,
        loadMoreError: false,
      };
    });

    try {
      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/epics?limit=${EPICS_PAGE_SIZE}&offset=${offset}`,
        {
          method: 'GET',
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
        setState((current) => {
          if (current.projectId !== projectId || current.page !== currentPage) {
            return current;
          }

          return {
            ...current,
            totalCount,
            nextOffset: totalCount,
            loadMoreError: false,
          };
        });

        return;
      }

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok || !isProjectEpics(data) || totalCount === null) {
        setState((current) => {
          if (current.projectId !== projectId || current.page !== currentPage) {
            return current;
          }

          return {
            ...current,
            loadMoreError: true,
          };
        });

        return;
      }

      setState((current) => {
        if (current.projectId !== projectId || current.page !== currentPage) {
          return current;
        }

        const existingEpicIds = new Set(current.epics.map((epic) => epic.id));

        const newEpics = data.filter((epic) => !existingEpicIds.has(epic.id));

        return {
          ...current,
          epics: [...current.epics, ...newEpics],
          totalCount,
          nextOffset: offset + data.length,
          loadMoreError: false,
        };
      });
    } catch {
      setState((current) => {
        if (current.projectId !== projectId || current.page !== currentPage) {
          return current;
        }

        return {
          ...current,
          loadMoreError: true,
        };
      });
    } finally {
      loadMoreInFlightRef.current = false;

      setState((current) => {
        if (current.projectId !== projectId || current.page !== currentPage) {
          return current;
        }

        return {
          ...current,
          isLoadingMore: false,
        };
      });
    }
  }, [
    currentPage,
    isCurrentPage,
    projectId,
    router,
    state.epics.length,
    state.isLoadingMore,
    state.loadMoreError,
    state.nextOffset,
    state.status,
    state.totalCount,
  ]);

  function retry() {
    setState({
      projectId,
      page: currentPage,
      epics: [],
      totalCount: 0,
      nextOffset: 0,
      status: 'loading',
      isLoadingMore: false,
      loadMoreError: false,
    });

    void loadEpics(currentPage);
  }

  return {
    epics: isCurrentPage ? state.epics : [],
    totalCount: isCurrentPage ? state.totalCount : 0,
    status: isCurrentPage ? state.status : 'loading',
    hasMore,
    isLoadingMore: isCurrentPage ? state.isLoadingMore : false,
    loadMoreError: isCurrentPage ? state.loadMoreError : false,
    loadMore,
    retry,
  };
}
