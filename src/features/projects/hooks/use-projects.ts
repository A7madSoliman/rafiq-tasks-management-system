'use client';

import { useCallback, useEffect, useState } from 'react';
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
  status: ProjectsStatus;
};

export function useProjects(currentPage = 1) {
  const router = useRouter();

  const [state, setState] = useState<ProjectsState>({
    page: currentPage,
    projects: [],
    totalCount: 0,
    status: 'loading',
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
            status: 'error',
          });
          return;
        }

        const projects = mapProjects(data);

        if (!projects || totalCount === null) {
          setState({
            page,
            projects: [],
            totalCount: 0,
            status: 'error',
          });
          return;
        }

        setState({
          page,
          projects,
          totalCount,
          status: 'success',
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setState({
          page,
          projects: [],
          totalCount: 0,
          status: 'error',
        });
      }
    },
    [router],
  );

  useEffect(() => {
    const controller = new AbortController();

    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProjects(currentPage, controller.signal);

    return () => {
      controller.abort();
    };
  }, [currentPage, loadProjects]);

  const isCurrentPage = state.page === currentPage;

  function retry() {
    setState({
      page: currentPage,
      projects: [],
      totalCount: 0,
      status: 'loading',
    });

    void loadProjects(currentPage);
  }

  return {
    projects: isCurrentPage ? state.projects : [],
    totalCount: isCurrentPage ? state.totalCount : 0,
    status: isCurrentPage ? state.status : 'loading',
    retry,
  };
}
