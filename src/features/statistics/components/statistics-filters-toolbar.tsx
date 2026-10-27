'use client';

import SelectChevron from '@/assets/icons/statistics/select-chevron.svg';
import MobileStatusChevron from '@/assets/icons/statistics/mobile-status-chevron.svg';
import { TASK_STATUSES } from '@/features/tasks/constants/task-statuses';
import { cn } from '@/lib/cn';
import { useStatisticsProjects } from '../hooks/use-statistics-projects';
import { calendarStatisticsRequestSchema } from '../schemas/statistics-schema';
import type { StatisticsFilters } from '../utils/statistics-filters';
import { StatisticsDateRange } from './statistics-date-range';
import { StatisticsSkeleton } from './statistics-loading-state';

const selectStyle =
  'text-foreground bg-surface-low min-h-11 w-full min-w-0 appearance-none rounded-md py-2.5 pl-4 pr-9 text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 lg:min-h-9 lg:rounded-xs lg:bg-surface lg:py-2 lg:text-sm lg:font-medium';

export function StatisticsFiltersToolbar({
  filters,
  onChange,
}: {
  filters: StatisticsFilters;
  onChange: (filters: StatisticsFilters) => void;
}) {
  const { projects, status, retry } = useStatisticsProjects();
  function apply(input: unknown) {
    const result = calendarStatisticsRequestSchema.safeParse(input);
    if (result.success) onChange(result.data);
  }
  return (
    <section
      aria-label="Statistics filters"
      className="lg:bg-surface-low grid min-w-0 grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-2 gap-y-4 lg:flex lg:items-center lg:gap-4 lg:rounded-md lg:p-4"
    >
      <StatisticsDateRange
        value={{ p_start_date: filters.p_start_date, p_end_date: filters.p_end_date }}
        onChange={(range) => apply({ ...filters, ...range })}
      />
      <div className="order-1 col-span-2 min-w-0 lg:order-2 lg:ml-auto lg:w-[204px]">
        {status === 'loading' ? (
          <div role="status" aria-label="Loading project options" aria-busy="true">
            <span className="sr-only">Loading project options...</span>
            <StatisticsSkeleton className="h-11 w-full rounded-md lg:h-9 lg:rounded-xs" />
          </div>
        ) : (
          <div className="relative">
            <select
              aria-label="Project"
              aria-describedby={
                status !== 'success' || projects.length === 0
                  ? 'statistics-project-feedback'
                  : undefined
              }
              className={cn(selectStyle, 'text-sm')}
              value={filters.p_project_id ?? ''}
              disabled={status !== 'success'}
              onChange={(event) => apply({ ...filters, p_project_id: event.target.value || null })}
            >
              <option value="">All Projects</option>
              {filters.p_project_id &&
                !projects.some((project) => project.id === filters.p_project_id) && (
                  <option value={filters.p_project_id} disabled>
                    Selected project unavailable
                  </option>
                )}
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2">
              <SelectChevron aria-hidden="true" />
            </span>
          </div>
        )}
        {status === 'error' && (
          <div id="statistics-project-feedback" className="mt-1 flex items-center gap-2 text-xs">
            <p role="alert" className="text-error">
              Unable to load projects.
            </p>
            <button type="button" onClick={retry} className="text-primary min-h-11 underline">
              Retry
            </button>
          </div>
        )}
        {status === 'success' && projects.length === 0 && (
          <p id="statistics-project-feedback" className="text-foreground-muted mt-1 text-xs">
            No projects available.
          </p>
        )}
      </div>
      <div className="relative order-2 min-w-0 lg:order-3 lg:w-[136px]">
        <select
          aria-label="Status"
          className={selectStyle}
          value={filters.p_status ?? ''}
          onChange={(event) => apply({ ...filters, p_status: event.target.value || null })}
        >
          <option value="">All Statuses</option>
          {TASK_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 lg:hidden">
          <MobileStatusChevron aria-hidden="true" />
        </span>
        <span className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 lg:block">
          <SelectChevron aria-hidden="true" />
        </span>
      </div>
    </section>
  );
}
