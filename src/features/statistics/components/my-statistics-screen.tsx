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

function SectionFeedback({
  label,
  retry,
  loading,
}: {
  label: string;
  retry?: () => void;
  loading: boolean;
}) {
  return (
    <div className="bg-surface flex min-h-40 flex-col items-center justify-center gap-3 rounded-md p-6 text-center">
      <p
        role={loading ? 'status' : 'alert'}
        className={loading ? 'text-foreground-muted text-sm' : 'text-error text-sm'}
      >
        {loading ? `Loading ${label}...` : `Unable to load ${label}.`}
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

export function StatisticsContent({ filters }: { filters: StatisticsFilters }) {
  const { calendar, projects } = useStatisticsData(filters);
  return (
    <>
      {calendar.status === 'success' ? (
        <>
          <StatisticsSummary data={calendar.data} />
          <StatisticsCalendar data={calendar.data} />
        </>
      ) : (
        <SectionFeedback
          label="calendar statistics"
          loading={calendar.status === 'loading'}
          retry={calendar.status === 'error' ? calendar.retry : undefined}
        />
      )}
      <div className="min-w-0">
        <h2 className="text-foreground mb-3 text-sm font-bold lg:sr-only">Task Statistics</h2>
        <div className="grid min-w-0 gap-3 lg:grid-cols-2 lg:gap-6">
          {calendar.status === 'success' ? (
            <TasksByStatus data={calendar.data} />
          ) : (
            <SectionFeedback
              label="tasks by status"
              loading={calendar.status === 'loading'}
              retry={calendar.status === 'error' ? calendar.retry : undefined}
            />
          )}
          {projects.status === 'success' ? (
            <AllProjectsStatistics projects={projects.data} />
          ) : (
            <SectionFeedback
              label="project statistics"
              loading={projects.status === 'loading'}
              retry={projects.status === 'error' ? projects.retry : undefined}
            />
          )}
        </div>
      </div>
    </>
  );
}

export function MyStatisticsScreen() {
  const [filters, setFilters] = useState<StatisticsFilters | null>(null);
  useEffect(() => {
    // The server's timezone must not decide the user's local week or cause hydration mismatches.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFilters(initialStatisticsFilters());
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[1280px] min-w-0 flex-col gap-6 p-4 lg:gap-8 lg:p-8">
      <header className="sr-only lg:not-sr-only">
        <h1 className="text-foreground text-[30px] leading-9 font-bold tracking-[-0.75px]">
          Weekly Planner
        </h1>
        <p className="text-foreground-secondary text-base leading-6">
          Manage your deadlines and track team velocity.
        </p>
      </header>
      {filters ? (
        <>
          <StatisticsFiltersToolbar
            filters={filters}
            onChange={(next) =>
              setFilters((current) => (current ? updateStatisticsFilters(current, next) : current))
            }
          />
          <StatisticsContent filters={filters} />
        </>
      ) : (
        <p role="status" className="text-foreground-muted text-sm">
          Preparing filters...
        </p>
      )}
    </div>
  );
}
