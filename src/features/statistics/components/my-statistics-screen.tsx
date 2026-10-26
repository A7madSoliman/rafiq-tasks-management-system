'use client';

import { useEffect, useState } from 'react';
import {
  initialStatisticsFilters,
  updateStatisticsFilters,
  type StatisticsFilters,
} from '../utils/statistics-filters';
import { StatisticsFiltersToolbar } from './statistics-filters-toolbar';

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
        <StatisticsFiltersToolbar
          filters={filters}
          onChange={(next) =>
            setFilters((current) => (current ? updateStatisticsFilters(current, next) : current))
          }
        />
      ) : (
        <p role="status" className="text-foreground-muted text-sm">
          Preparing filters...
        </p>
      )}
    </div>
  );
}
