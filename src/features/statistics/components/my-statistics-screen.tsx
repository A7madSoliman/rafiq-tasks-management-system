'use client';

import { useEffect, useState } from 'react';
import {
  initialStatisticsFilters,
  updateStatisticsFilters,
  type StatisticsFilters,
} from '../utils/statistics-filters';
import { StatisticsFiltersToolbar } from './statistics-filters-toolbar';
import { useStatisticsData } from '../hooks/use-statistics-data';
import { StatisticsSummary } from './statistics-summary';
import { StatisticsCalendar } from './statistics-calendar';
import { AllProjectsStatistics, TasksByStatus } from './statistics-analytics';
import {
  AllProjectsSkeleton,
  StatisticsCalendarSkeleton,
  StatisticsHeaderSkeleton,
  StatisticsInitialLoadingState,
  StatisticsSkeleton,
  StatisticsSummarySkeleton,
  TasksByStatusSkeleton,
} from './statistics-loading-state';

function SectionFeedback({ label, retry }: { label: string; retry?: () => void }) {
  return (
    <div className="bg-surface flex min-h-40 flex-col items-center justify-center gap-3 rounded-md p-6 text-center">
      <p role="alert" className="text-error text-sm">
        Unable to load {label}.
      </p>
      {retry && (
        <button
          type="button"
          onClick={retry}
          className="text-primary min-h-11 text-sm font-semibold underline"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export function StatisticsContent({
  filters,
  onInitialSettled,
}: {
  filters: StatisticsFilters;
  onInitialSettled?: (settled: boolean) => void;
}) {
  const { calendar, projects } = useStatisticsData(filters);
  useEffect(() => {
    if (calendar.status !== 'loading' && projects.status !== 'loading') onInitialSettled?.(true);
  }, [calendar.status, projects.status, onInitialSettled]);
  return (
    <>
      {calendar.status === 'success' ? (
        <>
          <StatisticsSummary data={calendar.data} />
          <StatisticsCalendar data={calendar.data} />
        </>
      ) : calendar.status === 'loading' ? (
        <>
          <StatisticsSummarySkeleton />
          <StatisticsCalendarSkeleton range={filters} />
        </>
      ) : (
        <SectionFeedback label="calendar statistics" retry={calendar.retry} />
      )}
      <div className="min-w-0">
        {calendar.status === 'loading' && projects.status === 'loading' ? (
          <>
            <h2 className="sr-only">Task Statistics</h2>
            <StatisticsSkeleton className="mb-3 h-5 w-28 rounded-xs lg:hidden" />
          </>
        ) : (
          <h2 className="text-foreground mb-3 text-sm font-bold lg:sr-only">Task Statistics</h2>
        )}
        <div className="grid min-w-0 gap-3 lg:grid-cols-2 lg:gap-6">
          {calendar.status === 'success' ? (
            <TasksByStatus data={calendar.data} />
          ) : calendar.status === 'loading' ? (
            <TasksByStatusSkeleton />
          ) : (
            <SectionFeedback label="tasks by status" retry={calendar.retry} />
          )}
          {projects.status === 'success' ? (
            <AllProjectsStatistics projects={projects.data} />
          ) : projects.status === 'loading' ? (
            <AllProjectsSkeleton />
          ) : (
            <SectionFeedback label="project statistics" retry={projects.retry} />
          )}
        </div>
      </div>
    </>
  );
}

export function MyStatisticsScreen() {
  const [filters, setFilters] = useState<StatisticsFilters | null>(null);
  const [initialSettled, setInitialSettled] = useState(false);
  useEffect(() => {
    // The server's timezone must not decide the user's local week or cause hydration mismatches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters(initialStatisticsFilters());
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[1280px] min-w-0 flex-col gap-6 p-4 lg:gap-8 lg:p-8">
      {initialSettled ? (
        <header className="sr-only lg:not-sr-only">
          <h1 className="text-foreground text-[30px] leading-9 font-bold tracking-[-0.75px]">
            Weekly Planner
          </h1>
          <p className="text-foreground-secondary text-base leading-6">
            Manage your deadlines and track team velocity.
          </p>
        </header>
      ) : (
        <StatisticsHeaderSkeleton />
      )}
      {filters ? (
        <>
          <StatisticsFiltersToolbar
            filters={filters}
            onChange={(next) =>
              setFilters((current) => (current ? updateStatisticsFilters(current, next) : current))
            }
          />
          <StatisticsContent
            filters={filters}
            onInitialSettled={initialSettled ? undefined : setInitialSettled}
          />
        </>
      ) : (
        <StatisticsInitialLoadingState />
      )}
    </div>
  );
}
