import { cn } from '@/lib/cn';

import { TASK_STATUSES } from '../constants/task-statuses';

type SkeletonProps = {
  className?: string;
};

function Skeleton({ className }: SkeletonProps) {
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

function TaskCardSkeleton() {
  return (
    <div className="bg-surface border-outline/10 flex h-[113px] shrink-0 flex-col gap-4 rounded-md border p-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3.5 w-full rounded-xs" />
        <Skeleton className="h-3.5 w-3/4 rounded-xs" />
      </div>

      <div className="mt-auto flex items-center justify-between">
        <Skeleton className="h-3 w-14 rounded-xs" />
        <Skeleton className="size-6 rounded-full" />
      </div>
    </div>
  );
}

function TaskColumnSkeleton({ index }: { index: number }) {
  const cardCount = index === 0 ? 2 : 1;

  return (
    <div className="flex h-full w-72 shrink-0 flex-col gap-4">
      <div className="flex h-[19px] items-center gap-2 px-1">
        <Skeleton className="size-2 rounded-full" />
        <Skeleton className="h-3 w-20 rounded-xs" />
        <Skeleton className="h-[19px] w-5 rounded-xs" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <Skeleton className="h-[52px] shrink-0 rounded-md" />

        {Array.from({ length: cardCount }, (_, cardIndex) => (
          <TaskCardSkeleton key={cardIndex} />
        ))}

        <div className="border-outline/20 bg-surface-low/30 min-h-[150px] flex-1 rounded-md border border-dashed" />
      </div>
    </div>
  );
}

export function ProjectTasksBoardLoadingState() {
  return (
    <div role="status" aria-label="Loading project tasks" className="min-w-0">
      <span className="sr-only">Loading project information and tasks...</span>

      {/* Desktop */}
      <div className="hidden lg:block">
        <header className="flex flex-col gap-6 px-8 pt-8 pb-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-16 rounded-xs" />
            <Skeleton className="h-3 w-3 rounded-xs" />
            <Skeleton className="h-3 w-28 rounded-xs" />
            <Skeleton className="h-3 w-3 rounded-xs" />
            <Skeleton className="h-3 w-12 rounded-xs" />
          </div>

          <div className="flex items-end justify-between gap-6">
            <div className="flex min-w-0 flex-col gap-2">
              <Skeleton className="h-9 w-64 rounded-sm" />
              <Skeleton className="h-4 w-80 max-w-full rounded-xs" />
            </div>

            <Skeleton className="h-10 w-64 shrink-0 rounded-sm" />
          </div>
        </header>

        <section aria-hidden="true" className="min-w-0 overflow-hidden px-8 pb-8">
          <div className="flex h-[calc(100dvh-282px)] min-h-[520px] w-max gap-6 pb-4">
            {TASK_STATUSES.map((status, index) => (
              <TaskColumnSkeleton key={status.value} index={index} />
            ))}
          </div>
        </section>
      </div>

      {/* Mobile */}
      <div className="flex min-h-[calc(100dvh-128px)] flex-col px-4 pt-[38px] pb-[65px] lg:hidden">
        <Skeleton className="h-9 w-64 max-w-full rounded-sm" />

        <div className="mt-6 flex flex-col gap-4">
          <Skeleton className="h-[47px] w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-sm" />
        </div>

        <Skeleton className="mt-7 min-h-[320px] w-full flex-1 rounded-md" />
      </div>
    </div>
  );
}
