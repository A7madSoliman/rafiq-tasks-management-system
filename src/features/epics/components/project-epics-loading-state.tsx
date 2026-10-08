import { cn } from '@/lib/cn';

type SkeletonProps = {
  className?: string;
};

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'from-surface-icon via-surface-low to-surface-icon animate-pulse bg-gradient-to-r',
        className,
      )}
    />
  );
}

function EpicCardSkeleton() {
  return (
    <div className="bg-surface flex min-h-[205px] flex-col gap-4 rounded-md p-4 shadow-sm lg:min-h-[218px]">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-20 rounded-sm opacity-40" />
        <Skeleton className="size-8 rounded-[12px]" />
      </div>

      <Skeleton className="h-6 w-full rounded-xs" />

      <div className="flex items-center gap-3 pt-4">
        <Skeleton className="size-8 shrink-0 rounded-[12px]" />
        <Skeleton className="h-4 w-32 rounded-xs" />
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-2">
        <Skeleton className="h-[6px] w-full rounded-xs" />

        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-12 rounded-xs" />
          <Skeleton className="h-3 w-12 rounded-xs" />
        </div>
      </div>
    </div>
  );
}

export function ProjectEpicsListLoadingState() {
  return (
    <div role="status">
      <span className="sr-only">Searching epics...</span>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-6">
        {Array.from({ length: 6 }, (_, index) => (
          <EpicCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function ProjectEpicsLoadingState() {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-8 lg:px-8">
      <div className="hidden lg:block">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16 rounded-xs opacity-60" />

          <span aria-hidden="true" className="text-foreground-secondary/40 text-xs">
            ›
          </span>

          <Skeleton className="h-4 w-24 rounded-xs" />
        </div>

        <div className="mt-8 flex items-end justify-between">
          <Skeleton className="h-10 w-64 rounded-sm" />

          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-32 rounded-xs" />
            <Skeleton className="h-10 w-40 rounded-xs" />
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-6">
          {Array.from({ length: 6 }, (_, index) => (
            <EpicCardSkeleton key={index} />
          ))}
        </div>
      </div>

      <div className="lg:hidden">
        <Skeleton className="h-12 w-full rounded-xs" />

        <div className="mt-6 flex flex-col gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <EpicCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
