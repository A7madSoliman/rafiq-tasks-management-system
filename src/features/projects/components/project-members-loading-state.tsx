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

function DesktopSkeletonRow() {
  return (
    <div className="grid grid-cols-[389px_188px] items-center border-t border-surface-icon">
      <div className="flex items-center gap-4 px-8 py-[18px]">
        <Skeleton className="size-12 shrink-0 rounded-[12px]" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-40 rounded-xs" />
          <Skeleton className="h-3 w-48 rounded-xs" />
        </div>
      </div>
      <div className="px-8 py-[34px]">
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

function MobileSkeletonCard() {
  return (
    <div className="bg-surface flex items-center justify-between gap-3 rounded-md p-4">
      <div className="flex min-w-0 items-center gap-4">
        <Skeleton className="size-12 shrink-0 rounded-[12px]" />
        <div className="flex min-w-0 flex-col gap-2">
          <Skeleton className="h-4 w-28 rounded-xs" />
          <Skeleton className="h-3 w-36 max-w-full rounded-xs" />
        </div>
      </div>
      <Skeleton className="h-[19px] w-14 shrink-0 rounded-full" />
    </div>
  );
}

export function ProjectMembersLoadingState() {
  return (
    <div role="status" aria-label="Loading project members">
      <span className="sr-only">Loading project members...</span>
      <div className="hidden lg:block">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16 rounded-xs" />
              <Skeleton className="h-3 w-2 rounded-xs" />
              <Skeleton className="h-3 w-24 rounded-xs" />
              <Skeleton className="h-3 w-2 rounded-xs" />
              <Skeleton className="h-3 w-16 rounded-xs" />
            </div>
            <Skeleton className="mt-6 h-9 w-64 rounded-sm" />
          </div>
          <Skeleton className="h-10 w-36 shrink-0 rounded-sm" />
        </div>

        <div className="mt-8 flex justify-center">
          <div className="bg-surface-low rounded-md p-1">
            <div className="bg-surface w-[577px] overflow-hidden rounded-md shadow-sm">
              <div className="bg-surface-nested/30 grid grid-cols-[389px_188px]">
                <div className="px-8 py-5"><Skeleton className="h-3 w-20 rounded-xs" /></div>
                <div className="px-8 py-5"><Skeleton className="h-3 w-16 rounded-xs" /></div>
              </div>
              {Array.from({ length: 5 }, (_, index) => (
                <DesktopSkeletonRow key={index} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <Skeleton className="mx-auto h-10 w-64 max-w-full rounded-sm" />
        <div className="mt-8 flex flex-col gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <MobileSkeletonCard key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
