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
  searchTerm: string;
};

export function useProjectEpics(projectId: string, currentPage = 1, searchTerm = '') {
  const router = useRouter();
  const normalizedSearchTerm = searchTerm.trim();

  const [state, setState] = useState<ProjectEpicsState>({
    projectId,
    page: currentPage,
    epics: [],
    totalCount: 0,
    nextOffset: 0,
    status: 'loading',
    isLoadingMore: false,
    loadMoreError: false,
    searchTerm: normalizedSearchTerm,
  });

  const loadMoreInFlightRef = useRef(false);

  const loadEpics = useCallback(
    async (page: number, signal?: AbortSignal) => {
      const offset = (page - 1) * EPICS_PAGE_SIZE;

      const requestParams = new URLSearchParams({
        limit: String(EPICS_PAGE_SIZE),
        offset: String(offset),
      });

      if (normalizedSearchTerm) {
        requestParams.set('search', normalizedSearchTerm);
      }

      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(projectId)}/epics?${requestParams.toString()}`,
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

          const redirectParams = new URLSearchParams({
            page: String(lastPage),
          });

          if (normalizedSearchTerm) {
            redirectParams.set('search', normalizedSearchTerm);
          }

          router.replace(
            `/project/${encodeURIComponent(projectId)}/epics?${redirectParams.toString()}`,
          );

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
            searchTerm: normalizedSearchTerm,
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
          searchTerm: normalizedSearchTerm,
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
          searchTerm: normalizedSearchTerm,
        });
      }
    },
    [projectId, router, normalizedSearchTerm],
  );

  useEffect(() => {
    const controller = new AbortController();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadEpics(currentPage, controller.signal);

    return () => {
      controller.abort();
    };
  }, [currentPage, loadEpics]);

  const isCurrentQuery =
    state.projectId === projectId &&
    state.page === currentPage &&
    state.searchTerm === normalizedSearchTerm;

  const hasMore =
    isCurrentQuery &&
    state.status === 'success' &&
    state.epics.length < state.totalCount &&
    state.nextOffset < state.totalCount;

  const loadMore = useCallback(async () => {
    if (
      !isCurrentQuery ||
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
      if (
        current.projectId !== projectId ||
        current.page !== currentPage ||
        current.searchTerm !== normalizedSearchTerm
      ) {
        return current;
      }

      return {
        ...current,
        isLoadingMore: true,
        loadMoreError: false,
      };
    });

    try {
      const requestParams = new URLSearchParams({
        limit: String(EPICS_PAGE_SIZE),
        offset: String(offset),
      });

      if (normalizedSearchTerm) {
        requestParams.set('search', normalizedSearchTerm);
      }

      const response = await fetch(
        `/api/projects/${encodeURIComponent(projectId)}/epics?${requestParams.toString()}`,
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
          if (
            current.projectId !== projectId ||
            current.page !== currentPage ||
            current.searchTerm !== normalizedSearchTerm
          ) {
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
          if (
            current.projectId !== projectId ||
            current.page !== currentPage ||
            current.searchTerm !== normalizedSearchTerm
          ) {
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
        if (
          current.projectId !== projectId ||
          current.page !== currentPage ||
          current.searchTerm !== normalizedSearchTerm
        ) {
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
        if (
          current.projectId !== projectId ||
          current.page !== currentPage ||
          current.searchTerm !== normalizedSearchTerm
        ) {
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
        if (
          current.projectId !== projectId ||
          current.page !== currentPage ||
          current.searchTerm !== normalizedSearchTerm
        ) {
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
    isCurrentQuery,
    projectId,
    router,
    state.epics.length,
    state.isLoadingMore,
    state.loadMoreError,
    state.nextOffset,
    state.status,
    state.totalCount,
    normalizedSearchTerm,
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
      searchTerm: normalizedSearchTerm,
    });

    void loadEpics(currentPage);
  }

  return {
    epics: isCurrentQuery ? state.epics : [],
    totalCount: isCurrentQuery ? state.totalCount : 0,
    status: isCurrentQuery ? state.status : 'loading',
    hasMore,
    isLoadingMore: isCurrentQuery ? state.isLoadingMore : false,
    loadMoreError: isCurrentQuery ? state.loadMoreError : false,
    loadMore,
    retry,
  };
}
