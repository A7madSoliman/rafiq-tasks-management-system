import { cn } from '@/lib/cn';

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

function EpicCardSkeleton() {
  return (
    <div className="bg-surface flex min-h-[205px] flex-col gap-4 rounded-md p-4 shadow-sm lg:min-h-[176px] lg:gap-2 lg:p-3">
      <Skeleton className="h-[23px] w-16 rounded-sm" />
      <Skeleton className="h-6 w-3/4 rounded-xs" />
      <div className="flex items-center gap-3 lg:pt-1">
        <Skeleton className="size-10 shrink-0 rounded-[12px] lg:size-9" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-3 w-14 rounded-xs" />
          <Skeleton className="h-4 w-32 rounded-xs" />
        </div>
      </div>
      <div className="border-surface-low mt-auto flex items-center justify-between border-t pt-4 lg:pt-2">
        <Skeleton className="h-3 w-36 rounded-xs" />
        <Skeleton className="h-3 w-24 rounded-xs" />
      </div>
    </div>
  );
}

export function ProjectEpicsListLoadingState() {
  return (
    <div role="status" aria-label="Searching epics">
      <span className="sr-only">Searching epics...</span>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
        {Array.from({ length: 6 }, (_, index) => (
          <EpicCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

export function ProjectEpicsLoadingState() {
  return (
    <div role="status" aria-label="Loading project epics" className="w-full px-4 py-8 lg:px-8 lg:pb-4">
      <span className="sr-only">Loading project epics...</span>
      <div className="hidden flex-col gap-10 lg:flex">
        <div className="flex items-end justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16 rounded-xs" />
              <Skeleton className="h-3 w-2 rounded-xs" />
              <Skeleton className="h-3 w-24 rounded-xs" />
              <Skeleton className="h-3 w-2 rounded-xs" />
              <Skeleton className="h-3 w-12 rounded-xs" />
            </div>
            <Skeleton className="mt-6 h-9 w-56 rounded-sm" />
          </div>
          <div className="flex shrink-0 items-center gap-8">
            <Skeleton className="h-10 w-64 rounded-sm" />
            <Skeleton className="h-10 w-32 rounded-sm" />
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-2 gap-4">
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
