import { cn } from '@/lib/cn';
import type { StatisticsDateRange } from '../schemas/statistics-schema';
import { shiftCalendarDate } from '../utils/statistics-dates';

export function StatisticsSkeleton({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'from-surface-icon via-surface-low to-surface-icon animate-pulse bg-gradient-to-r motion-reduce:animate-none',
        className,
      )}
    />
  );
}

export function StatisticsHeaderSkeleton() {
  return (
    <header
      role="status"
      aria-label="Loading statistics dashboard"
      className="sr-only lg:not-sr-only"
    >
      <h1 className="sr-only">Weekly Planner</h1>
      <div aria-hidden="true" className="flex flex-col">
        <StatisticsSkeleton className="h-9 w-[218px] rounded-sm" />
        <StatisticsSkeleton className="h-6 w-[362px] rounded-xs" />
      </div>
    </header>
  );
}

export function StatisticsInitialLoadingState() {
  return (
    <>
      <span role="status" className="sr-only">
        Preparing statistics dashboard...
      </span>
      <div aria-hidden="true" className="flex min-w-0 flex-col gap-6 lg:gap-8">
        <div className="lg:bg-surface-low grid min-w-0 grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-x-2 gap-y-4 lg:flex lg:items-center lg:gap-4 lg:rounded-md lg:p-4">
          <StatisticsSkeleton className="order-3 h-11 min-w-0 rounded-md lg:order-1 lg:h-9 lg:w-48 lg:rounded-xs" />
          <StatisticsSkeleton className="order-1 col-span-2 h-11 min-w-0 rounded-md lg:order-2 lg:ml-auto lg:h-9 lg:w-[204px] lg:rounded-xs" />
          <StatisticsSkeleton className="order-2 h-11 min-w-0 rounded-md lg:order-3 lg:h-9 lg:w-[136px] lg:rounded-xs" />
        </div>
        <StatisticsSummarySkeleton />
        <StatisticsCalendarSkeleton />
        <div className="min-w-0">
          <div className="mb-3 lg:hidden">
            <StatisticsSkeleton className="h-5 w-28 rounded-xs" />
          </div>
          <div className="grid min-w-0 gap-3 lg:grid-cols-2 lg:gap-6">
            <TasksByStatusSkeleton />
            <AllProjectsSkeleton />
          </div>
        </div>
      </div>
    </>
  );
}

export function StatisticsSummarySkeleton() {
  return (
    <section role="status" aria-label="Loading calendar statistics" className="min-w-0">
      <span className="sr-only">Loading calendar statistics...</span>
      <div aria-hidden="true">
        <div className="mb-3 h-4 lg:hidden">
          <StatisticsSkeleton className="h-3 w-24 rounded-xs" />
        </div>
        <div className="flex min-w-0 gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:pb-0">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="bg-surface flex min-h-[104px] min-w-[98px] flex-1 flex-col justify-between rounded-md p-3 lg:flex-row lg:items-center lg:p-6"
            >
              <div className="order-2 flex flex-col gap-1 lg:order-1">
                <StatisticsSkeleton className="h-3 w-16 max-w-full rounded-xs lg:w-28" />
                <StatisticsSkeleton className="h-7 w-10 rounded-xs lg:h-9 lg:w-14" />
              </div>
              <StatisticsSkeleton className="order-1 size-6 rounded-xs lg:order-2 lg:size-12" />
            </div>
          ))}
        </div>
        <StatisticsSkeleton className="mt-2 h-3 w-56 max-w-full rounded-xs" />
      </div>
    </section>
  );
}

export function StatisticsCalendarSkeleton({ range }: { range?: StatisticsDateRange }) {
  const days = range
    ? Array.from({ length: 7 }, (_, index) => shiftCalendarDate(range.p_start_date, index)).filter(
        (day) => day <= range.p_end_date,
      )
    : Array.from({ length: 7 }, (_, index) => String(index));
  return (
    <section aria-hidden="true" className="min-w-0">
      <div className="mb-3 lg:hidden">
        <StatisticsSkeleton className="h-5 w-20 rounded-xs" />
      </div>
      <div
        className="hidden min-w-0 gap-3 lg:grid"
        style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
      >
        {days.map((day) => (
          <div
            key={day}
            className="bg-surface flex h-[420px] min-w-0 flex-col gap-3 rounded-md p-4 shadow-sm"
          >
            <StatisticsSkeleton className="h-4 w-8 rounded-xs" />
            <StatisticsSkeleton className="h-7 w-16 max-w-full rounded-xs" />
            <div className="mt-2 flex flex-col gap-2">
              <StatisticsSkeleton className="h-8 w-full rounded-xs" />
              <StatisticsSkeleton className="h-8 w-full rounded-xs" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex min-w-0 flex-col gap-1 lg:hidden">
        {days.map((day) => (
          <div
            key={day}
            className="bg-surface-low flex min-h-11 min-w-0 items-center gap-3 rounded-md px-3 py-2"
          >
            <div className="flex w-8 shrink-0 flex-col gap-1">
              <StatisticsSkeleton className="h-2 w-6 rounded-xs" />
              <StatisticsSkeleton className="h-4 w-5 rounded-xs" />
            </div>
            <StatisticsSkeleton className="h-4 w-5 shrink-0 rounded-xs" />
            <StatisticsSkeleton className="h-4 w-7 rounded-xs" />
            <StatisticsSkeleton className="h-4 w-5 rounded-xs" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function TasksByStatusSkeleton() {
  return (
    <section
      aria-hidden="true"
      className="bg-surface min-w-0 rounded-md p-4 lg:min-h-[210px] lg:p-6"
    >
      <StatisticsSkeleton className="h-5 w-32 rounded-xs" />
      <div className="mt-5 flex min-w-0 items-center gap-4 lg:mt-8 lg:gap-6">
        <div
          aria-hidden="true"
          className="border-surface-icon size-[126px] shrink-0 animate-pulse rounded-full border-[14px] motion-reduce:animate-none lg:size-36"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex min-w-0 items-center gap-2">
              <StatisticsSkeleton className="size-2 shrink-0 rounded-full" />
              <StatisticsSkeleton className="h-3 w-16 max-w-full rounded-xs" />
              <StatisticsSkeleton className="ml-auto h-3 w-3 shrink-0 rounded-xs" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AllProjectsSkeleton() {
  return (
    <section
      role="status"
      aria-label="Loading project statistics"
      className="bg-surface min-w-0 rounded-md p-4 lg:min-h-[210px] lg:p-6"
    >
      <span className="sr-only">Loading project statistics...</span>
      <StatisticsSkeleton className="h-5 w-24 rounded-xs" />
      <StatisticsSkeleton className="mt-1 h-3 w-44 max-w-full rounded-xs" />
      <div aria-hidden="true" className="mt-6 flex min-w-0 flex-col gap-4 lg:mt-8">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex min-w-0 items-center justify-between gap-3">
            <StatisticsSkeleton className="h-3 w-28 max-w-[65%] rounded-xs" />
            <StatisticsSkeleton className="h-3 w-12 shrink-0 rounded-xs" />
          </div>
        ))}
      </div>
    </section>
  );
}
