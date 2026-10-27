'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { PROJECTS_PAGE_SIZE } from '@/features/projects/constants/projects-pagination';
import type { Project } from '@/features/projects/types/project';
import { mapProjects } from '@/features/projects/utils/map-projects';
import { parseContentRangeTotal } from '@/features/projects/utils/parse-content-range';

type State = { status: 'loading' | 'success' | 'error'; projects: Project[] };

export function useStatisticsProjects() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ status: 'loading', projects: [] });

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setState({ status: 'loading', projects: [] });
      const projects = new Map<string, Project>();
      let offset = 0;
      try {
        for (;;) {
          const response = await fetch(
            `/api/projects?limit=${PROJECTS_PAGE_SIZE}&offset=${offset}`,
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
          if (!response.ok) throw new Error('Unable to load projects.');
          const total = parseContentRangeTotal(response.headers.get('content-range'));
          const body: unknown = await response.json();
          if (controller.signal.aborted) return;
          const page = mapProjects(body);
          if (
            !page ||
            total === null ||
            page.length > PROJECTS_PAGE_SIZE ||
            page.some((project) => !z.uuid().safeParse(project.id).success) ||
            (page.length === 0 && offset < total)
          )
            throw new Error('Invalid project page.');
          for (const project of page) projects.set(project.id, project);
          // Advance by the raw page size, not the deduplicated number of options.
          offset += page.length;
          if (offset >= total) break;
        }
        setState({ status: 'success', projects: Array.from(projects.values()) });
      } catch {
        if (!controller.signal.aborted) setState({ status: 'error', projects: [] });
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt, router]);

  return { ...state, retry: () => setAttempt((current) => current + 1) };
}
