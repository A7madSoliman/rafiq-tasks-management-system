'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PROJECTS_PAGE_SIZE } from '../constants/projects-pagination';
import type { Project } from '../types/project';
import { mapProjects } from '../utils/map-projects';
import { parseContentRangeTotal } from '../utils/parse-content-range';

type ProjectsStatus = 'loading' | 'success' | 'error';

type ProjectsState = {
  page: number;
  projects: Project[];
  totalCount: number;
  nextOffset: number;
  status: ProjectsStatus;
  isLoadingMore: boolean;
  loadMoreError: boolean;
};

export function useProjects(currentPage = 1) {
  const router = useRouter();
  const loadMoreInFlightRef = useRef(false);

  const [state, setState] = useState<ProjectsState>({
    page: currentPage,
    projects: [],
    totalCount: 0,
    nextOffset: 0,
    status: 'loading',
    isLoadingMore: false,
    loadMoreError: false,
  });

  const loadProjects = useCallback(
    async (page: number, signal?: AbortSignal) => {
      const offset = (page - 1) * PROJECTS_PAGE_SIZE;

      try {
        const response = await fetch(`/api/projects?limit=${PROJECTS_PAGE_SIZE}&offset=${offset}`, {
          method: 'GET',
          signal,
          cache: 'no-store',
        });

        if (response.status === 401) {
          router.replace('/login');
          router.refresh();
          return;
        }

        const totalCount = parseContentRangeTotal(response.headers.get('content-range'));

        if (response.status === 416 && totalCount !== null) {
          const lastPage = Math.max(Math.ceil(totalCount / PROJECTS_PAGE_SIZE), 1);

          router.replace(`/project?page=${lastPage}`);
          return;
        }

        const data: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          setState({
            page,
            projects: [],
            totalCount: 0,
            nextOffset: 0,
            status: 'error',
            isLoadingMore: false,
            loadMoreError: false,
          });
          return;
        }

        const projects = mapProjects(data);

        if (!projects || totalCount === null) {
          setState({
            page,
            projects: [],
            totalCount: 0,
            nextOffset: 0,
            status: 'error',
            isLoadingMore: false,
            loadMoreError: false,
          });
          return;
        }

        setState({
          page,
          projects,
          totalCount,
          nextOffset: offset + projects.length,
          status: 'success',
          isLoadingMore: false,
          loadMoreError: false,
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setState({
          page,
          projects: [],
          totalCount: 0,
          nextOffset: 0,
          status: 'error',
          isLoadingMore: false,
          loadMoreError: false,
        });
      }
    },
    [router],
  );

  useEffect(() => {
    const controller = new AbortController();

    loadMoreInFlightRef.current = false;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProjects(currentPage, controller.signal);

    return () => {
      controller.abort();
    };
  }, [currentPage, loadProjects]);

  const loadMore = useCallback(async () => {
    if (
      state.status !== 'success' ||
      state.nextOffset >= state.totalCount ||
      state.projects.length >= state.totalCount ||
      loadMoreInFlightRef.current
    ) {
      return;
    }

    const page = state.page;
    const offset = state.nextOffset;

    loadMoreInFlightRef.current = true;

    setState((current) => {
      if (current.page !== page) {
        return current;
      }

      return {
        ...current,
        isLoadingMore: true,
        loadMoreError: false,
      };
    });

    try {
      const response = await fetch(`/api/projects?limit=${PROJECTS_PAGE_SIZE}&offset=${offset}`, {
        method: 'GET',
        cache: 'no-store',
      });

      if (response.status === 401) {
        router.replace('/login');
        router.refresh();
        return;
      }

      const totalCount = parseContentRangeTotal(response.headers.get('content-range'));

      if (response.status === 416 && totalCount !== null) {
        setState((current) => {
          if (current.page !== page) {
            return current;
          }

          return {
            ...current,
            totalCount,
            nextOffset: totalCount,
            isLoadingMore: false,
            loadMoreError: false,
          };
        });

        return;
      }

      const data: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        setState((current) => {
          if (current.page !== page) {
            return current;
          }

          return {
            ...current,
            isLoadingMore: false,
            loadMoreError: true,
          };
        });

        return;
      }

      const projects = mapProjects(data);

      if (!projects || totalCount === null) {
        setState((current) => {
          if (current.page !== page) {
            return current;
          }

          return {
            ...current,
            isLoadingMore: false,
            loadMoreError: true,
          };
        });

        return;
      }

      setState((current) => {
        if (current.page !== page) {
          return current;
        }

        const existingProjectIds = new Set(current.projects.map((project) => project.id));

        const newProjects = projects.filter((project) => !existingProjectIds.has(project.id));

        return {
          ...current,
          projects: [...current.projects, ...newProjects],
          totalCount,
          nextOffset: offset + projects.length,
          isLoadingMore: false,
          loadMoreError: false,
        };
      });
    } catch {
      setState((current) => {
        if (current.page !== page) {
          return current;
        }

        return {
          ...current,
          isLoadingMore: false,
          loadMoreError: true,
        };
      });
    } finally {
      loadMoreInFlightRef.current = false;
    }
  }, [router, state]);

  const isCurrentPage = state.page === currentPage;

  function retry() {
    setState({
      page: currentPage,
      projects: [],
      totalCount: 0,
      nextOffset: 0,
      status: 'loading',
      isLoadingMore: false,
      loadMoreError: false,
    });

    void loadProjects(currentPage);
  }

  const projects = isCurrentPage ? state.projects : [];
  const totalCount = isCurrentPage ? state.totalCount : 0;

  return {
    projects,
    totalCount,
    status: isCurrentPage ? state.status : 'loading',

    hasMore:
      isCurrentPage &&
      state.status === 'success' &&
      state.nextOffset < totalCount &&
      projects.length < totalCount,

    isLoadingMore: isCurrentPage && state.isLoadingMore,
    loadMoreError: isCurrentPage && state.loadMoreError,

    loadMore,
    retry,
  };
}
