'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  calendarMatchesRange,
  calendarStatisticsSchema,
  projectsStatisticsSchema,
  statisticsDateRangeSchema,
  type CalendarStatistics,
  type ProjectStatistics,
} from '../schemas/statistics-schema';
import type { StatisticsFilters } from '../utils/statistics-filters';

type LoadState<T> = { key: string; status: 'success'; data: T } | { key: string; status: 'error' };
export type SectionState<T> =
  { status: 'loading' } | { status: 'error'; retry: () => void } | { status: 'success'; data: T };

async function postStatistics(path: string, body: object, signal: AbortSignal) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal,
  });
  if (response.status === 401) return { unauthorized: true as const };
  if (!response.ok) throw new Error('Unable to load statistics.');
  const data: unknown = await response.json();
  return { unauthorized: false as const, data };
}

export function useStatisticsData(filters: StatisticsFilters) {
  const router = useRouter();
  const [calendarAttempt, setCalendarAttempt] = useState(0);
  const [projectsAttempt, setProjectsAttempt] = useState(0);
  const [calendarResult, setCalendarResult] = useState<LoadState<CalendarStatistics> | null>(null);
  const [projectsResult, setProjectsResult] = useState<LoadState<ProjectStatistics[]> | null>(null);
  const { p_start_date, p_end_date, p_project_id, p_status } = filters;
  const calendarKey = JSON.stringify([
    p_start_date,
    p_end_date,
    p_project_id,
    p_status,
    calendarAttempt,
  ]);
  const projectsKey = JSON.stringify([p_start_date, p_end_date, projectsAttempt]);

  useEffect(() => {
    if (!statisticsDateRangeSchema.safeParse({ p_start_date, p_end_date }).success) return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await postStatistics(
          '/api/statistics/calendar',
          {
            p_start_date,
            p_end_date,
            p_project_id,
            p_status,
          },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        if (response.unauthorized) {
          router.replace('/login');
          router.refresh();
          return;
        }
        const parsed = calendarStatisticsSchema.safeParse(response.data);
        if (!parsed.success || !calendarMatchesRange(parsed.data, { p_start_date, p_end_date }))
          throw new Error('Invalid calendar statistics.');
        setCalendarResult({ key: calendarKey, status: 'success', data: parsed.data });
      } catch {
        if (!controller.signal.aborted) setCalendarResult({ key: calendarKey, status: 'error' });
      }
    }
    void load();
    return () => controller.abort();
  }, [calendarKey, p_start_date, p_end_date, p_project_id, p_status, router]);

  useEffect(() => {
    if (!statisticsDateRangeSchema.safeParse({ p_start_date, p_end_date }).success) return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await postStatistics(
          '/api/statistics/projects',
          {
            p_start_date,
            p_end_date,
          },
          controller.signal,
        );
        if (controller.signal.aborted) return;
        if (response.unauthorized) {
          router.replace('/login');
          router.refresh();
          return;
        }
        const parsed = projectsStatisticsSchema.safeParse(response.data);
        if (!parsed.success) throw new Error('Invalid project statistics.');
        setProjectsResult({ key: projectsKey, status: 'success', data: parsed.data });
      } catch {
        if (!controller.signal.aborted) setProjectsResult({ key: projectsKey, status: 'error' });
      }
    }
    void load();
    return () => controller.abort();
  }, [projectsKey, p_start_date, p_end_date, router]);

  const calendar: SectionState<CalendarStatistics> =
    calendarResult?.key !== calendarKey
      ? { status: 'loading' }
      : calendarResult.status === 'error'
        ? { status: 'error', retry: () => setCalendarAttempt((value) => value + 1) }
        : { status: 'success', data: calendarResult.data };
  const projects: SectionState<ProjectStatistics[]> =
    projectsResult?.key !== projectsKey
      ? { status: 'loading' }
      : projectsResult.status === 'error'
        ? { status: 'error', retry: () => setProjectsAttempt((value) => value + 1) }
        : { status: 'success', data: projectsResult.data };
  return { calendar, projects };
}
